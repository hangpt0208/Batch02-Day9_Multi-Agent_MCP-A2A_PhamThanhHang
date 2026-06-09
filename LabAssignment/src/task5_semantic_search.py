"""
Task 5 — Semantic Search Module.

Viết module tìm kiếm ngữ nghĩa (dense retrieval) trên vector store.

Yêu cầu:
    - Input: query string + top_k
    - Output: danh sách chunks có score, sorted descending
    - Phải tương thích với embedding model và vector store ở Task 4
"""


def semantic_search(query: str, top_k: int = 10) -> list[dict]:
    """
    Tìm kiếm ngữ nghĩa sử dụng vector similarity.

    Args:
        query: Câu truy vấn
        top_k: Số lượng kết quả tối đa

    Returns:
        List of {
            'content': str,      # Nội dung chunk
            'score': float,      # Cosine similarity score
            'metadata': dict     # source, doc_type, chunk_index
        }
        Sorted by score descending.
    """
    import weaviate
    from weaviate.classes.query import MetadataQuery
    global _MODEL_CACHE
    if "_MODEL_CACHE" not in globals():
        globals()["_MODEL_CACHE"] = {}
        
    model_name = "BAAI/bge-m3"
    if model_name not in globals()["_MODEL_CACHE"]:
        from sentence_transformers import SentenceTransformer
        print(f"  [INFO] Loading model {model_name} into cache...")
        globals()["_MODEL_CACHE"][model_name] = SentenceTransformer(model_name)
        
    model = globals()["_MODEL_CACHE"][model_name]
    query_embedding = model.encode(query).tolist()

    # 2. Kết nối tới Weaviate Cloud
    load_dotenv()
    weaviate_url = os.getenv("WEAVIATE_URL", "")
    weaviate_api_key = os.getenv("WEAVIATE_API_KEY", "")

    if not weaviate_url.startswith("http"):
        weaviate_url = "https://" + weaviate_url

    try:
        client = weaviate.connect_to_weaviate_cloud(
            cluster_url=weaviate_url,
            auth_credentials=weaviate.auth.AuthApiKey(weaviate_api_key),
            skip_init_checks=True
        )
    except Exception as e:
        print(f"[ERROR] Không thể kết nối Weaviate Cloud: {e}")
        print("Đảm bảo file .env chứa thông tin chính xác.")
        return []

    try:
        # Lấy collection đã tạo từ Task 4
        collection = client.collections.get("DrugLawDocs")

        # 3. Thực thi truy vấn Semantic Search (near_vector)
        # Weaviate sẽ tìm các vector gần nhất bằng thuật toán so khớp (mặc định HNSW)
        results = collection.query.near_vector(
            near_vector=query_embedding,
            limit=top_k,
            return_metadata=MetadataQuery(distance=True)  # Yêu cầu trả về khoảng cách (distance)
        )

        # 4. Parse kết quả trả về
        formatted_results = []
        for obj in results.objects:
            # Weaviate trả về 'distance' (Cosine distance).
            # Công thức chuyển đổi: Cosine Similarity = 1 - Cosine Distance
            distance = obj.metadata.distance if obj.metadata.distance is not None else 1.0
            similarity_score = 1.0 - distance

            formatted_results.append({
                "content": obj.properties.get("content", ""),
                "score": similarity_score,
                "metadata": {
                    "source": obj.properties.get("source", ""),
                    "doc_type": obj.properties.get("doc_type", ""),
                    "chunk_index": obj.properties.get("chunk_index", -1)
                }
            })
            
        return formatted_results

    except Exception as e:
        print(f"[ERROR] Lỗi khi thực hiện query trên Weaviate: {e}")
        return []
    finally:
        # Luôn đóng kết nối
        client.close()


if __name__ == "__main__":
    # Test
    results = semantic_search("hình phạt cho tội tàng trữ ma tuý", top_k=5)
    for r in results:
        print(f"[{r['score']:.3f}] {r['content'][:100]}...")

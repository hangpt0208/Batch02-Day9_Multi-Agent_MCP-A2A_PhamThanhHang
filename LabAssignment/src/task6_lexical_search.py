"""
Task 6 — Lexical Search Module (BM25).

Cơ chế Weaviate BM25 built-in (+5 bonus):
Thay vì load lại toàn bộ văn bản (corpus) vào RAM để tính toán thủ công bằng thư viện `rank-bm25`, 
chúng ta tận dụng thuật toán BM25F (mở rộng của BM25) được tích hợp sẵn (built-in) bên trong Weaviate.
- Tốc độ vượt trội: Weaviate tự động tạo inverted index (chỉ mục ngược) ở tầng dưới (C/Go) ngay từ lúc chúng ta chạy Task 4.
- Tiết kiệm RAM: Không cần lưu lại CORPUS khổng lồ trong Python.
- Công thức: Vẫn dựa trên Term Frequency (TF - tần suất từ) và Inverse Document Frequency (IDF - độ hiếm), 
  nhưng Weaviate tối ưu hóa thuật toán và có thể tìm kiếm từ khóa trên nhiều trường dữ liệu (properties) cùng lúc (ví dụ: tìm trên cả 'content' lẫn 'title').
"""

from pathlib import Path

def build_bm25_index(corpus: list[dict] = None):
    
    """
    Task 6 — Lexical Search Module (BM25).

    Cơ chế Weaviate BM25 built-in (+5 bonus):
    Thay vì load lại toàn bộ văn bản (corpus) vào RAM để tính toán thủ công bằng thư viện `rank-bm25`, 
    chúng ta tận dụng thuật toán BM25F (mở rộng của BM25) được tích hợp sẵn (built-in) bên trong Weaviate.
    - Tốc độ vượt trội: Weaviate tự động tạo inverted index (chỉ mục ngược) ở tầng dưới (C/Go) ngay từ lúc chúng ta chạy Task 4.
    - Tiết kiệm RAM: Không cần lưu lại CORPUS khổng lồ trong Python.
    - Công thức: Vẫn dựa trên Term Frequency (TF - tần suất từ) và Inverse Document Frequency (IDF - độ hiếm), 
    nhưng Weaviate tối ưu hóa thuật toán và có thể tìm kiếm từ khóa trên nhiều trường dữ liệu (properties) cùng lúc (ví dụ: tìm trên cả 'content' lẫn 'title').
    """

from pathlib import Path

def build_bm25_index(corpus: list[dict] = None):
    """
    Sử dụng Weaviate BM25 Built-in nên inverted index đã được tạo sẵn trên Cloud!
    Hàm này được để lại nhằm tương thích với cấu trúc pipeline chung, không cần nạp dữ liệu.
    """
    print("  [INFO] Sử dụng Weaviate BM25 Built-in. Index từ khóa đã có sẵn trên Database Server.")
    pass

def lexical_search(query: str, top_k: int = 10) -> list[dict]:
    """
    Tìm kiếm từ khóa (Lexical Search) sử dụng BM25 Built-in của Weaviate Cloud.
    """
    import weaviate
    from weaviate.classes.query import MetadataQuery
    import os
    from dotenv import load_dotenv

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
        return []

    try:
        collection = client.collections.get("DrugLawDocs")
        
        # Thực thi tìm kiếm Lexical bằng BM25 built-in của Weaviate
        # Vì Task 4 dùng chunking recursive nên chỉ có trường content chứa văn bản
        results = collection.query.bm25(
            query=query,
            query_properties=["content"], 
            limit=top_k,
            return_metadata=MetadataQuery(score=True) # BM25 trả về thuộc tính score
        )

        formatted_results = []
        for obj in results.objects:
            formatted_results.append({
                "content": obj.properties.get("content", ""),
                "score": obj.metadata.score if obj.metadata.score is not None else 0.0,
                "metadata": {
                    "source": obj.properties.get("source", ""),
                    "doc_type": obj.properties.get("doc_type", ""),
                    "chunk_index": obj.properties.get("chunk_index", -1)
                }
            })
            
        return formatted_results

    except Exception as e:
        print(f"[ERROR] Lỗi khi thực hiện query BM25 trên Weaviate: {e}")
        return []
    finally:
        client.close()

if __name__ == "__main__":
    # Test thử chức năng tìm kiếm từ khoá BM25
    build_bm25_index()
    results = lexical_search("Điều 248 tàng trữ trái phép chất ma tuý", top_k=5)
    
    print(f"\n--- Kết quả tìm kiếm Lexical (Weaviate BM25) ---")
    for r in results:
        print(f"[Score: {r['score']:.3f}] {r['content'][:150]}...\n")

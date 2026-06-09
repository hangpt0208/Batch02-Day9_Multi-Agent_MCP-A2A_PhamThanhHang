"""
Task 4 — Chunking & Indexing vào Vector Store.

Hướng dẫn:
    1. Đọc toàn bộ markdown files từ data/standardized/
    2. Chọn 1 chunking strategy (giải thích lý do)
    3. Chọn 1 embedding model (giải thích lý do)
    4. Index vào vector store (Weaviate khuyến cáo)

Chunking options (langchain-text-splitters):
    - RecursiveCharacterTextSplitter: an toàn, phổ biến
    - MarkdownHeaderTextSplitter: tốt cho file có heading
    - SemanticChunker: dùng embedding để tách (nâng cao)

Embedding model options:
    - sentence-transformers/all-MiniLM-L6-v2 (384 dim, nhẹ)
    - BAAI/bge-m3 (1024 dim, multilingual, tốt cho tiếng Việt)
    - OpenAI text-embedding-3-small (1536 dim, API)

Vector store options:
    - Weaviate (khuyến cáo: hỗ trợ hybrid search built-in)
    - ChromaDB (đơn giản, local)
    - FAISS (chỉ dense search)

Cài đặt:
    pip install langchain-text-splitters sentence-transformers weaviate-client
"""

from pathlib import Path

STANDARDIZED_DIR = Path(__file__).parent.parent / "data" / "standardized"


# =============================================================================
# CONFIGURATION — Giải thích lựa chọn của bạn trong comment
# =============================================================================

# TODO: Chọn chunking strategy và giải thích vì sao

# Chọn kích thước 600 ký tự (khoảng 100-110 từ tiếng Việt). Độ dài này vừa vặn với cấu trúc của một 
# "Khoản" hoặc "Điểm" trong văn bản luật, giúp chunk chứa trọn vẹn một ý pháp lý mà không bị quá tải ngữ cảnh.
CHUNK_SIZE = 600
# Chọn gối đầu 60 ký tự (10% của CHUNK_SIZE). Việc lặp lại một đoạn ngắn giúp bảo toàn ngữ cảnh 
# ở các vị trí vết cắt, tránh tình trạng câu chữ bị chặt đứt đôi làm mất ý nghĩa khi AI truy vấn.
CHUNK_OVERLAP = 60  
# Chọn chiến lược RecursiveCharacterTextSplitter vì đây là giải pháp an toàn và phổ biến nhất.
# Nó chủ động đếm ký tự nên đảm bảo 100% mọi tài liệu (luật lẫn báo chí) đều được băm nhỏ thành công,
# không lo bị sót hay lỗi hệ thống nếu file bị mất định dạng tiêu đề Markdown.
CHUNKING_METHOD = "recursive"  # "recursive" | "markdown_header" | "semantic"


# TODO: Chọn embedding model và giải thích
# Chọn mô hình BAAI/bge-m3 vì đây là mô hình đa ngôn ngữ (multilingual) tối ưu nhất hiện tại cho tiếng Việt.
# Văn bản luật Việt Nam chứa rất nhiều từ chuyên ngành phức tạp (tàng trữ, tiền chất...), mô hình all-MiniLM-L6-v2 
# (thuần tiếng Anh) không thể hiểu đúng được, nên bge-m3 là lựa chọn bắt buộc để đảm bảo độ chính xác.
EMBEDDING_MODEL = "BAAI/bge-m3"  
EMBEDDING_DIM = 1024 # Độ dài vector đặc trưng của bge-m3

# TODO: Chọn vector store
VECTOR_STORE = "weaviate"  # "weaviate" | "chromadb" | "faiss"


# =============================================================================
# IMPLEMENTATION
# =============================================================================

def load_documents() -> list[dict]:
    """
    Đọc toàn bộ markdown files từ data/standardized/.
    """
    documents = []
    for md_file in STANDARDIZED_DIR.rglob("*.md"):
        content = md_file.read_text(encoding="utf-8")
        # Bỏ qua file rỗng (ví dụ do lỗi convert trước đó)
        if not content.strip():
            continue
            
        doc_type = "legal" if "legal" in str(md_file) else "news"
        documents.append({
            "content": content,
            "metadata": {"source": md_file.name, "type": doc_type}
        })
    return documents


def chunk_documents(documents: list[dict]) -> list[dict]:
    """
    Chunk documents bằng RecursiveCharacterTextSplitter.
    """
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    chunks = []
    for doc in documents:
        splits = splitter.split_text(doc["content"])
        for i, chunk_text in enumerate(splits):
            chunks.append({
                "content": chunk_text,
                "metadata": {**doc["metadata"], "chunk_index": i}
            })
    return chunks


def embed_chunks(chunks: list[dict]) -> list[dict]:
    """
    Embed toàn bộ chunks bằng sentence-transformers.
    """
    from sentence_transformers import SentenceTransformer

    print(f"  Downloading/Loading model {EMBEDDING_MODEL} (có thể hơi lâu ở lần đầu tiên)...")
    model = SentenceTransformer(EMBEDDING_MODEL)
    texts = [c["content"] for c in chunks]
    embeddings = model.encode(texts, show_progress_bar=True)
    for chunk, emb in zip(chunks, embeddings):
        chunk["embedding"] = emb.tolist()
    return chunks


def index_to_vectorstore(chunks: list[dict]):
    """
    Lưu chunks vào Weaviate Cloud.
    """
    import weaviate
    from weaviate.classes.config import Configure, Property, DataType
    import os
    from dotenv import load_dotenv

    load_dotenv()
    weaviate_url = os.getenv("WEAVIATE_URL", "")
    weaviate_api_key = os.getenv("WEAVIATE_API_KEY", "")

    if not weaviate_url.startswith("http"):
        weaviate_url = "https://" + weaviate_url

    print("  Connecting to Weaviate Cloud...")
    try:
        client = weaviate.connect_to_weaviate_cloud(
            cluster_url=weaviate_url,
            auth_credentials=weaviate.auth.AuthApiKey(weaviate_api_key),
            skip_init_checks=True
        )
    except Exception as e:
        print(f"[ERROR] Lỗi kết nối Weaviate Cloud: {e}")
        print("  Vui lòng kiểm tra lại thông tin WEAVIATE_URL và WEAVIATE_API_KEY trong file .env")
        return

    try:
        collection_name = "DrugLawDocs"
        # Xoá nếu đã tồn tại để tránh duplicate
        if client.collections.exists(collection_name):
            client.collections.delete(collection_name)

        # Tạo collection
        collection = client.collections.create(
            name=collection_name,
            vectorizer_config=Configure.Vectorizer.none(),
            properties=[
                Property(name="content", data_type=DataType.TEXT),
                Property(name="source", data_type=DataType.TEXT),
                Property(name="doc_type", data_type=DataType.TEXT),
                Property(name="chunk_index", data_type=DataType.INT),
            ]
        )

        # Insert chunks
        with collection.batch.dynamic() as batch:
            for chunk in chunks:
                batch.add_object(
                    properties={
                        "content": chunk["content"],
                        "source": chunk["metadata"]["source"],
                        "doc_type": chunk["metadata"]["type"],
                        "chunk_index": chunk["metadata"]["chunk_index"],
                    },
                    vector=chunk["embedding"]
                )
        print(f"  ✓ Đã index {len(chunks)} chunks vào Weaviate ({collection_name}).")
    finally:
        client.close()


def run_pipeline():
    """Chạy toàn bộ pipeline: load → chunk → embed → index."""
    print("=" * 50)
    print("Task 4: Chunking & Indexing")
    print(f"  Chunking: {CHUNKING_METHOD} (size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})")
    print(f"  Embedding: {EMBEDDING_MODEL} (dim={EMBEDDING_DIM})")
    print(f"  Vector Store: {VECTOR_STORE}")
    print("=" * 50)

    docs = load_documents()
    print(f"\n✓ Loaded {len(docs)} documents")

    chunks = chunk_documents(docs)
    print(f"✓ Created {len(chunks)} chunks")

    chunks = embed_chunks(chunks)
    print(f"✓ Embedded {len(chunks)} chunks")

    index_to_vectorstore(chunks)
    print("✓ Indexed to vector store")


if __name__ == "__main__":
    run_pipeline()

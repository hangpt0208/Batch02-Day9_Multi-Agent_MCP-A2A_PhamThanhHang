"""
Task 7 — Reranking Module.

Chọn 1 trong các phương pháp:
    - Cross-encoder reranker: Jina Reranker v2 (multilingual) hoặc Qwen3-Reranker
    - MMR (Maximal Marginal Relevance): tự implement
    - RRF (Reciprocal Rank Fusion): tự implement

Nếu dùng MMR hoặc RRF, đảm bảo hiểu và giải thích được cơ chế.
"""

from typing import Optional
import math


def cosine_sim(vec1: list[float], vec2: list[float]) -> float:
    """Hàm tính cosine similarity phụ trợ cho MMR"""
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm_a = math.sqrt(sum(a * a for a in vec1))
    norm_b = math.sqrt(sum(b * b for b in vec2))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)


def rerank_cross_encoder(
    query: str, candidates: list[dict], top_k: int = 5
) -> list[dict]:
    """
    Rerank candidates sử dụng cross-encoder model (Jina Reranker).
    """
    import requests
    import os
    from dotenv import load_dotenv

    load_dotenv()
    JINA_API_KEY = os.getenv("JINA_API_KEY")

    if not JINA_API_KEY:
        print("[ERROR] Không tìm thấy JINA_API_KEY trong file .env. Bỏ qua reranking.")
        return candidates[:top_k]

    if not candidates:
        return []

    try:
        response = requests.post(
            "https://api.jina.ai/v1/rerank",
            headers={
                "Authorization": f"Bearer {JINA_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "jina-reranker-v2-base-multilingual",
                "query": query,
                "documents": [c["content"] for c in candidates],
                "top_n": top_k
            }
        )
        response.raise_for_status()
        reranked = response.json()["results"]
        
        # Jina trả về list of dicts: {"index": 0, "relevance_score": 0.89}
        # Ta map ngược lại vào candidates ban đầu
        return [
            {**candidates[r["index"]], "score": r["relevance_score"]}
            for r in reranked
        ]
    except Exception as e:
        print(f"[ERROR] Lỗi gọi API Jina Reranker: {e}")
        # Fallback trả về list cũ nếu gọi API thất bại
        return candidates[:top_k]


def rerank_mmr(
    query_embedding: list[float],
    candidates: list[dict],
    top_k: int = 5,
    lambda_param: float = 0.7,
) -> list[dict]:
    """
    Maximal Marginal Relevance — chọn candidates vừa relevant (liên quan) vừa diverse (đa dạng).
    Công thức: MMR = λ * sim(query, doc) - (1-λ) * max(sim(doc, selected_docs))
    """
    if not candidates:
        return []
        
    selected = []
    remaining = list(range(len(candidates)))

    for _ in range(min(top_k, len(candidates))):
        best_idx = None
        best_score = float('-inf')

        for idx in remaining:
            # Relevance to query
            relevance = cosine_sim(query_embedding, candidates[idx].get("embedding", []))

            # Max similarity to already selected
            max_sim_to_selected = 0.0
            for sel_idx in selected:
                sim = cosine_sim(candidates[idx].get("embedding", []), candidates[sel_idx].get("embedding", []))
                max_sim_to_selected = max(max_sim_to_selected, sim)

            # MMR score calculation
            mmr_score = lambda_param * relevance - (1 - lambda_param) * max_sim_to_selected

            if mmr_score > best_score:
                best_score = mmr_score
                best_idx = idx

        if best_idx is not None:
            selected.append(best_idx)
            remaining.remove(best_idx)

    return [candidates[i] for i in selected]


def rerank_rrf(
    ranked_lists: list[list[dict]], top_k: int = 5, k: int = 60
) -> list[dict]:
    """
    Reciprocal Rank Fusion — gộp kết quả từ nhiều ranker (BM25 + Semantic Search).
    Công thức: RRF(d) = Σ 1 / (k + rank_r(d))
    """
    rrf_scores = {}  
    content_map = {} 

    for ranked_list in ranked_lists:
        for rank, item in enumerate(ranked_list, 1):
            key = item["content"]
            rrf_scores[key] = rrf_scores.get(key, 0.0) + 1.0 / (k + rank)
            content_map[key] = item

    # Sắp xếp lại dựa trên điểm RRF
    sorted_items = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)

    results = []
    for content, score in sorted_items[:top_k]:
        item = content_map[content].copy()
        item["score"] = score # Ghi đè điểm cũ bằng điểm RRF
        results.append(item)

    return results


# =============================================================================
# Main rerank interface
# =============================================================================

def rerank(
    query: str,
    candidates: list[dict],
    top_k: int = 5,
    method: str = "cross_encoder",  # "cross_encoder" | "mmr" | "rrf"
    # Các tham số phụ trợ tùy method
    query_embedding: Optional[list[float]] = None,
    ranked_lists: Optional[list[list[dict]]] = None
) -> list[dict]:
    """
    Unified reranking interface.
    """
    if method == "cross_encoder":
        return rerank_cross_encoder(query, candidates, top_k)
    elif method == "mmr":
        if query_embedding is None:
            raise ValueError("Cần cung cấp query_embedding để chạy MMR")
        return rerank_mmr(query_embedding, candidates, top_k)
    elif method == "rrf":
        if ranked_lists is None:
            raise ValueError("Cần cung cấp ranked_lists để chạy RRF")
        return rerank_rrf(ranked_lists, top_k)
    else:
        raise ValueError(f"Unknown rerank method: {method}")


if __name__ == "__main__":
    # Test thử chức năng Jina Reranker với Dummy Data
    dummy_candidates = [
        {"content": "Điều 248: Tội tàng trữ trái phép chất ma tuý", "score": 0.8, "metadata": {}},
        {"content": "Nghệ sĩ X bị bắt vì sử dụng ma tuý", "score": 0.7, "metadata": {}},
        {"content": "Hình phạt tù từ 2-7 năm cho tội tàng trữ ma túy theo luật.", "score": 0.6, "metadata": {}},
    ]
    
    print("Đang gọi Jina API để Rerank...")
    results = rerank("hình phạt tàng trữ ma tuý", dummy_candidates, top_k=2, method="cross_encoder")
    
    print("\n--- Kết quả Reranking (Jina Cross-Encoder) ---")
    for r in results:
        print(f"[Score: {r['score']:.3f}] {r['content']}")

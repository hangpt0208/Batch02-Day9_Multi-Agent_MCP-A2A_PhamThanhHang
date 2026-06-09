# RAG Evaluation Results

## Framework sử dụng

Sử dụng lightweight deterministic evaluator theo phong cách RAGAS/DeepEval: metric được tính bằng token overlap giữa expected answer/context và retrieved context. Cách này chạy local ổn định, không tốn thêm LLM judge quota, và vẫn bao phủ 4 metric bắt buộc.

## Overall Scores

| Metric | Config A: hybrid + rerank | Config B: hybrid no rerank | Δ |
|---|---:|---:|---:|
| Faithfulness | 0.999 | 1.000 | -0.001 |
| Answer Relevance | 0.553 | 0.016 | 0.537 |
| Context Recall | 0.746 | 0.023 | 0.723 |
| Context Precision | 0.511 | 0.023 | 0.488 |
| Average | 0.702 | 0.266 | 0.437 |

## A/B Comparison Analysis

**Config A:** Hybrid retrieval gồm semantic search + BM25, merge bằng RRF và rerank bằng Jina.

**Config B:** Hybrid retrieval gồm semantic search + BM25, merge bằng RRF nhưng không rerank.

**Kết luận:** Config có điểm Average cao hơn là cấu hình được khuyến nghị cho demo. Nếu Config A tốt hơn, reranking giúp đưa context liên quan lên đầu; nếu Config B tốt hơn hoặc tương đương, có thể ưu tiên B khi cần giảm chi phí API.

## Worst Performers (Bottom 3 - Config A)

| # | Question | Faithfulness | Relevance | Recall | Precision | Retrieved Sources |
|---|---|---:|---:|---:|---:|---|
| 13 | Số tiền giao dịch mua bán ma túy mà cơ quan điều tra làm rõ trong chuyên án là bao nhiêu? | 1.000 | 0.000 | 0.000 | 0.000 | unknown |
| 5 | Chuyên án triệt phá đường dây ma túy từ Pháp về Việt Nam đã khởi tố bao nhiêu bị can? | 1.000 | 0.256 | 0.474 | 0.242 | article_04.md, article_04.md, article_04.md, article_04.md, article_04.md |
| 15 | Ca sĩ Chi Dân đã hoạt động nghệ thuật từ năm nào và từng bị nghi liên quan ma túy trước đây chưa? | 1.000 | 0.383 | 0.556 | 0.233 | article_03.md, article_02.md, article_05.md, article_03.md, article_02.md |

## Recommendations

### Cải tiến 1
**Action:** Bổ sung thêm văn bản pháp luật còn thiếu nếu golden dataset mở rộng sang các nghị định/danh mục chưa có trong corpus.  
**Expected impact:** Tăng context recall cho các câu hỏi pháp luật chuyên sâu.

### Cải tiến 2
**Action:** Chuẩn hóa và làm giàu metadata source, ví dụ tên văn bản, số điều, ngày bài báo.  
**Expected impact:** Citation đẹp hơn và context precision dễ phân tích hơn.

### Cải tiến 3
**Action:** Điều chỉnh top_k và ngưỡng fallback PageIndex cho các câu hỏi khó.  
**Expected impact:** Giảm nguy cơ thiếu evidence khi câu hỏi cần nhiều đoạn chứng cứ.

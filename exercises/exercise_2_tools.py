"""Bài Tập 2: Thêm Tools và Knowledge Base

Hoàn thành các TODO để thêm tool và knowledge base entry mới.
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool

from common.llm import get_llm

# Knowledge base
LEGAL_KNOWLEDGE = [
    {
        "id": "ucc_breach",
        "keywords": ["breach", "contract", "remedies", "damages", "ucc"],
        "text": (
            "Under the Uniform Commercial Code (UCC) Article 2, remedies for breach of contract "
            "include: (1) expectation damages; (2) consequential damages; (3) specific performance; "
            "(4) cover damages. Statute of limitations is typically 4 years (UCC § 2-725)."
        ),
    },
    # TODO: Thêm entry về luật lao động Việt Nam
    # Gợi ý: id="labor_law", keywords=["lao động", "sa thải", ...], text="..."
    {
        "id": "vietnam_labor_law",
        "keywords": ["lao động", "sa thải", "việc làm", "hợp đồng lao động", "labor"],
        "text": (
            "Theo Bộ luật Lao động Việt Nam 2019, thời hiệu yêu cầu tòa án giải quyết tranh chấp lao động "
            "cá nhân là 01 năm kể từ ngày phát hiện ra hành vi mà mỗi bên tranh chấp cho rằng quyền và "
            "lợi ích hợp pháp của mình bị vi phạm. Đối với trường hợp bị xử lý kỷ luật sa thải thì thời hiệu là 01 năm."
        ),
    }
]


@tool
def search_legal_knowledge(query: str) -> str:
    """Tìm kiếm trong knowledge base pháp lý."""
    query_lower = query.lower()
    for entry in LEGAL_KNOWLEDGE:
        if any(kw in query_lower for kw in entry["keywords"]):
            return f"[{entry['id']}] {entry['text']}"
    return "Không tìm thấy thông tin liên quan."


# TODO: Tạo tool check_statute_of_limitations
@tool
def check_statute_of_limitations(case_type: str) -> str:
    """Kiểm tra thời hiệu khởi kiện dựa trên loại vụ việc (case_type) như dân sự, hình sự, lao động, hợp đồng."""
    case_type_lower = case_type.lower()
    if "hợp đồng" in case_type_lower or "contract" in case_type_lower:
        return "Thời hiệu khởi kiện để yêu cầu Tòa án giải quyết tranh chấp hợp đồng là 03 năm, kể từ ngày người có quyền yêu cầu biết hoặc phải biết quyền và lợi ích hợp pháp của mình bị xâm phạm (Theo Điều 429 Bộ luật Dân sự 2015)."
    elif "lao động" in case_type_lower or "labor" in case_type_lower:
        return "Thời hiệu giải quyết tranh chấp lao động cá nhân là 01 năm kể từ ngày phát hiện hành vi vi phạm (Theo Bộ luật Lao động 2019)."
    elif "dân sự" in case_type_lower:
        return "Thời hiệu khởi kiện vụ án dân sự thông thường là 03 năm kể từ ngày biết quyền lợi bị xâm phạm (Điều 184 BLDS 2015)."
    else:
        return f"Không tìm thấy quy định cụ thể cho loại vụ việc '{case_type}'. Thông thường thời hiệu dân sự là 3 năm."


def safe_print(text: str) -> None:
    try:
        print(text)
    except UnicodeEncodeError:
        import sys
        encoding = sys.stdout.encoding or 'utf-8'
        safe_text = text.encode(encoding, errors='replace').decode(encoding)
        print(safe_text)


async def main():
    load_dotenv()
    llm = get_llm()
    
    # TODO: Thêm tool mới vào danh sách
    tools = [search_legal_knowledge, check_statute_of_limitations]  # Thêm check_statute_of_limitations vào đây
    llm_with_tools = llm.bind_tools(tools)
    
    question = "Thời hiệu khởi kiện vụ vi phạm hợp đồng là bao lâu?"
    
    messages = [
        SystemMessage(content="Bạn là chuyên gia pháp lý. Sử dụng tools để tra cứu thông tin."),
        HumanMessage(content=question),
    ]
    
    safe_print(f"Câu hỏi: {question}\n")
    
    # First LLM call - decide which tools to use
    response = await llm_with_tools.ainvoke(messages)
    messages.append(response)
    
    # Execute tools if requested
    if response.tool_calls:
        for tool_call in response.tool_calls:
            safe_print(f"🔧 Gọi tool: {tool_call['name']}")
            tool_result = None
            
            if tool_call["name"] == "search_legal_knowledge":
                tool_result = search_legal_knowledge.invoke(tool_call["args"])
            elif tool_call["name"] == "check_statute_of_limitations":
                tool_result = check_statute_of_limitations.invoke(tool_call["args"])
            
            if tool_result:
                messages.append(ToolMessage(content=tool_result, tool_call_id=tool_call["id"]))
        
        # Second LLM call - synthesize final answer
        final_response = await llm_with_tools.ainvoke(messages)
        safe_print(f"\n✅ Kết quả:\n{final_response.content}")
    else:
        safe_print(f"\n✅ Kết quả:\n{response.content}")


if __name__ == "__main__":
    asyncio.run(main())

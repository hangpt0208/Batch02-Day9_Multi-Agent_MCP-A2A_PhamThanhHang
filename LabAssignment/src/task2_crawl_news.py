"""
Task 2 — Crawl bài báo về nghệ sĩ liên quan tới ma tuý.

Hướng dẫn:
    1. Crawl tối thiểu 5 bài báo từ các trang tin tức Việt Nam.
    2. Sử dụng Crawl4AI hoặc thư viện crawling tương tự.
    3. Lưu output vào data/landing/news/
    4. Mỗi bài lưu 1 file JSON với metadata (url, title, date_crawled, content).

Cài đặt:
    pip install crawl4ai
"""

import asyncio
import json
from datetime import datetime
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data" / "landing" / "news"


def setup_directory():
    """Tạo thư mục data/landing/news/ nếu chưa có."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)


ARTICLE_URLS = [
    "https://vnexpress.net/su-nghiep-long-nhat-truoc-khi-bi-bat-vi-lien-quan-ma-tuy-5076081.html",
    "https://vnexpress.net/20-nam-hoat-dong-cua-miu-le-truoc-khi-bi-bat-qua-tang-dung-ma-tuy-5072922.html",
    "https://vnexpress.net/son-ngoc-minh-hot-boy-vpop-mot-thoi-vuong-lao-ly-5076096.html",
    "https://tuoitre.vn/miu-le-bi-khoi-to-tam-giam-cong-ty-quan-ly-khang-dinh-khong-bao-che-20260516231928239.htm",
    "https://tuoitre.vn/miu-le-va-loat-nghe-si-lech-chuan-nghe-si-sao-ky-vay-20260513094939879.htm",
]


async def crawl_article(url: str) -> dict:
    """
    Crawl một bài báo và trả về dict chứa metadata + content.

    Returns:
        {
            "url": str,
            "title": str,
            "date_crawled": str (ISO format),
            "content_markdown": str
        }
    """
    from crawl4ai import AsyncWebCrawler

    # Implement crawling logic
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(url=url)
        return {
            "url": url,
            "title": result.metadata.get("title", "Unknown") if result.metadata else "Unknown",
            "date_crawled": datetime.now().isoformat(),
            "content_markdown": result.markdown,
        }


async def crawl_all():
    """Crawl toàn bộ bài báo trong ARTICLE_URLS."""
    setup_directory()

    for i, url in enumerate(ARTICLE_URLS, 1):
        print(f"[{i}/{len(ARTICLE_URLS)}] Crawling: {url}")
        article = await crawl_article(url)

        # Lưu file JSON
        filename = f"article_{i:02d}.json"
        filepath = DATA_DIR / filename
        filepath.write_text(json.dumps(article, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  ✓ Saved: {filepath}")


if __name__ == "__main__":
    if not ARTICLE_URLS:
        print("⚠ Hãy điền ARTICLE_URLS trước khi chạy!")
        print("Gợi ý: tìm bài báo trên VnExpress, Tuổi Trẻ, Thanh Niên, ...")
    else:
        try:
            asyncio.run(crawl_all())
        except RuntimeError as e:
            if "Event loop is closed" not in str(e):
                raise

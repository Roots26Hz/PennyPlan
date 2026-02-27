"""
PennyPlan — Retail Scraping Pipeline
=====================================
This script scrapes furniture data from mass-market retailers
and uploads it to Pinecone for vector-based matching.

Usage:
    pip install playwright beautifulsoup4 pinecone-client openai
    playwright install chromium
    python scraper.py --retailer ikea --category sofa --max-price 500

For the hackathon prototype, this is scaffolding for production use.
The Next.js app uses mock data when Pinecone is not configured.
"""

import argparse
import asyncio
import json
import os
import sys
from dataclasses import dataclass, asdict
from typing import Optional

# These imports will work once dependencies are installed
try:
    from playwright.async_api import async_playwright
    from bs4 import BeautifulSoup
    HAS_SCRAPING_DEPS = True
except ImportError:
    HAS_SCRAPING_DEPS = False
    print("[Warning] Scraping dependencies not installed. Install with:")
    print("  pip install playwright beautifulsoup4")
    print("  playwright install chromium")


@dataclass
class FurnitureData:
    name: str
    category: str
    retailer: str
    price: float
    url: str
    image_url: str
    width_in: float
    depth_in: float
    height_in: float
    style: list[str]
    color: str
    rating: float
    review_count: int
    in_stock: bool


RETAILER_URLS = {
    "ikea": {
        "sofa": "https://www.ikea.com/us/en/cat/sofas-fu003/",
        "chair": "https://www.ikea.com/us/en/cat/armchairs-fu006/",
        "table": "https://www.ikea.com/us/en/cat/coffee-side-tables-10705/",
        "desk": "https://www.ikea.com/us/en/cat/desks-20649/",
        "bed": "https://www.ikea.com/us/en/cat/beds-bm003/",
        "bookshelf": "https://www.ikea.com/us/en/cat/bookcases-10382/",
        "lamp": "https://www.ikea.com/us/en/cat/lamps-li001/",
    },
    "wayfair": {
        "sofa": "https://www.wayfair.com/furniture/sb0/sofas-c413892.html",
        "table": "https://www.wayfair.com/furniture/sb0/coffee-tables-c413958.html",
        "bed": "https://www.wayfair.com/bed-bath/sb0/beds-c45200.html",
    },
}


async def scrape_ikea(url: str, category: str, max_price: float) -> list[FurnitureData]:
    """Scrape IKEA product listings."""
    if not HAS_SCRAPING_DEPS:
        return []

    items = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            await page.goto(url, wait_until="networkidle", timeout=30000)
            await page.wait_for_selector(".plp-fragment-wrapper", timeout=10000)

            content = await page.content()
            soup = BeautifulSoup(content, "html.parser")

            product_cards = soup.select(".plp-fragment-wrapper .pip-product-compact")
            
            for card in product_cards[:20]:  # Limit to 20 per page
                try:
                    name_el = card.select_one(".pip-header-section__title--small")
                    price_el = card.select_one(".pip-price__integer")
                    link_el = card.select_one("a.pip-product-compact")

                    if not name_el or not price_el:
                        continue

                    name = name_el.get_text(strip=True)
                    price = float(price_el.get_text(strip=True).replace(",", "").replace("$", ""))

                    if price > max_price:
                        continue

                    item = FurnitureData(
                        name=name,
                        category=category,
                        retailer="IKEA",
                        price=price,
                        url=link_el["href"] if link_el else url,
                        image_url="",
                        width_in=0,
                        depth_in=0,
                        height_in=0,
                        style=["modern", "scandinavian"],
                        color="",
                        rating=0.0,
                        review_count=0,
                        in_stock=True,
                    )
                    items.append(item)
                except Exception as e:
                    print(f"  [Skip] Error parsing product: {e}")
                    continue

        except Exception as e:
            print(f"[Error] Failed to scrape {url}: {e}")
        finally:
            await browser.close()

    return items


async def scrape_retailer(retailer: str, category: str, max_price: float) -> list[FurnitureData]:
    """Route to the appropriate scraper based on retailer."""
    urls = RETAILER_URLS.get(retailer, {})
    url = urls.get(category)
    
    if not url:
        print(f"[Skip] No URL configured for {retailer}/{category}")
        return []

    print(f"[Scraping] {retailer} / {category} (max ${max_price})...")

    if retailer == "ikea":
        return await scrape_ikea(url, category, max_price)
    
    # Add more retailer scrapers here
    print(f"[Skip] Scraper not yet implemented for {retailer}")
    return []


def upload_to_pinecone(items: list[FurnitureData]):
    """Upload scraped items to Pinecone with embeddings."""
    try:
        from pinecone import Pinecone
        from openai import OpenAI

        pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY", ""))
        index = pc.Index(os.environ.get("PINECONE_INDEX_NAME", "pennyplan-furniture"))
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

        for item in items:
            # Generate embedding from item description
            text = f"{item.name} {item.category} {' '.join(item.style)} {item.color} furniture"
            embedding = client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            ).data[0].embedding

            # Upsert to Pinecone
            index.upsert(vectors=[{
                "id": f"{item.retailer}-{item.name}".replace(" ", "-").lower()[:64],
                "values": embedding,
                "metadata": asdict(item),
            }])

        print(f"[Pinecone] Uploaded {len(items)} items")

    except Exception as e:
        print(f"[Error] Pinecone upload failed: {e}")
        print("[Fallback] Saving to local JSON instead")
        
        os.makedirs("data", exist_ok=True)
        with open("data/scraped_items.json", "w") as f:
            json.dump([asdict(item) for item in items], f, indent=2)
        print(f"[Saved] {len(items)} items to data/scraped_items.json")


async def main():
    parser = argparse.ArgumentParser(description="PennyPlan Retail Scraper")
    parser.add_argument("--retailer", default="ikea", choices=["ikea", "wayfair", "amazon", "walmart"])
    parser.add_argument("--category", default="sofa")
    parser.add_argument("--max-price", type=float, default=500)
    parser.add_argument("--upload", action="store_true", help="Upload results to Pinecone")
    args = parser.parse_args()

    items = await scrape_retailer(args.retailer, args.category, args.max_price)
    print(f"\n[Result] Scraped {len(items)} items")

    for item in items:
        print(f"  - {item.name}: ${item.price} ({item.retailer})")

    if args.upload and items:
        upload_to_pinecone(items)


if __name__ == "__main__":
    asyncio.run(main())

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
import hashlib
import json
import os
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
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


def load_dotenv_file() -> None:
    """Load key/value pairs from the project .env file if present."""
    candidates = [
        Path.cwd() / ".env",
        Path(__file__).resolve().parent.parent / ".env",
        Path(__file__).resolve().parent / ".env",
    ]

    env_path = next((path for path in candidates if path.exists()), None)
    if not env_path:
        return

    for raw_line in env_path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export "):].strip()
        if "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


load_dotenv_file()


def build_local_embedding(text: str, dimensions: int = 1536) -> list[float]:
    """Create a deterministic local embedding without external API calls."""
    import re

    vector = [0.0] * dimensions
    tokens = re.findall(r"[a-z0-9]+", text.lower())

    if not tokens:
        return vector

    for token in tokens:
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        index = int.from_bytes(digest[:4], "big") % dimensions
        weight = 1.0 + (digest[4] / 255.0)
        vector[index] += weight

    norm = sum(value * value for value in vector) ** 0.5
    if norm:
        vector = [value / norm for value in vector]

    return vector


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
    "target": {
        "sofa": "https://www.target.com/c/sofas-couches-living-room-furniture/-/N-5xtm1",
        "chair": "https://www.target.com/c/accent-chairs/-/N-5xsxp?sortBy=price-low-to-high",
        "table": "https://www.target.com/c/coffee-tables/-/N-5xsx3?sortBy=price-low-to-high",
        "desk": "https://www.target.com/c/desks/-/N-5xsxq?sortBy=price-low-to-high",
        "bed": "https://www.target.com/c/beds/-/N-5xsxm?sortBy=price-low-to-high",
        "bookshelf": "https://www.target.com/c/bookcases-shelves/-/N-5xsxk?sortBy=price-low-to-high",
        "lamp": "https://www.target.com/c/lamps/-/N-5xsxo?sortBy=price-low-to-high",
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


async def scrape_target(url: str, category: str, max_price: float) -> list[FurnitureData]:
    """Scrape Target product listings."""
    if not HAS_SCRAPING_DEPS:
        return []

    items = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        # Add user agent to avoid detection
        page.set_extra_http_headers(
            {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        )

        try:
            await page.goto(url, wait_until="load", timeout=30000)  # Load instead of networkidle
            await page.wait_for_timeout(2000)  # Wait 2 seconds for dynamic content

            content = await page.content()
            soup = BeautifulSoup(content, "html.parser")

            # Target uses data-test selectors for product cards
            product_cards = soup.select('[data-test="@web/ProductCard"]')
            if not product_cards:
                # Fallback: try common product divs
                product_cards = soup.select('div[class*="ProductCard"]')
                if not product_cards:
                    # Another fallback: look for links with product info
                    product_cards = soup.select('a[href*="/p/"]')

            for card in product_cards[:20]:  # Limit to 20
                try:
                    # Extract product info
                    title_el = card.select_one('[data-test="@web/ProductCard/Title"]')
                    price_el = card.select_one('[data-test="@web/ProductCard/PriceOverlay/Text"]')
                    link_el = card.select_one('a[href*="/p/"]') if title_el else card

                    if not title_el and isinstance(card, type(link_el)):
                        # If card is already a link, try to get title from text
                        name = card.get_text(strip=True)[:100]
                        if not name:
                            continue
                    else:
                        if not title_el:
                            continue
                        name = title_el.get_text(strip=True)

                    if price_el:
                        price_text = price_el.get_text(strip=True)
                    else:
                        # Try to find price in card text
                        price_text = card.get_text(strip=True)
                        # Extract price from text like "$299.99"
                        import re
                        match = re.search(r'\$(\d+(?:\.\d{2})?)', price_text)
                        if not match:
                            continue
                        price_text = match.group(1)

                    # Extract price (handle "$299.99" format)
                    try:
                        price = float(price_text.replace("$", "").replace(",", "").split("/")[0].strip())
                    except:
                        continue

                    if price > max_price:
                        continue

                    link = ""
                    if link_el:
                        link = link_el.get("href", "")
                        if link and not link.startswith("http"):
                            link = "https://www.target.com" + link

                    item = FurnitureData(
                        name=name[:100],
                        category=category,
                        retailer="Target",
                        price=price,
                        url=link or url,
                        image_url="",
                        width_in=0,
                        depth_in=0,
                        height_in=0,
                        style=[],
                        color="",
                        rating=0.0,
                        review_count=0,
                        in_stock=True,
                    )
                    items.append(item)
                    print(f"  ✓ {name[:50]}... - ${price}")

                except Exception as e:
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
    elif retailer == "target":
        return await scrape_target(url, category, max_price)
    
    # Add more retailer scrapers here
    print(f"[Skip] Scraper not yet implemented for {retailer}")
    return []


def upload_to_pinecone(items: list[FurnitureData]):
    """Upload scraped items to Pinecone with embeddings."""
    try:
        from pinecone import Pinecone

        pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY", ""))
        index = pc.Index(os.environ.get("PINECONE_INDEX_NAME", "pennyplan-furniture"))

        for item in items:
            # Generate a deterministic local embedding from item metadata.
            text = f"{item.name} {item.category} {' '.join(item.style)} {item.color} furniture"
            embedding = build_local_embedding(text)

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
    parser.add_argument("--retailer", default="target", choices=["ikea", "target", "wayfair", "amazon", "walmart"])
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

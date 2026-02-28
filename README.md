# PennyPlan

**Furnish Smart. Spend Less.**

An AI-powered budget home decor optimizer that turns hand-drawn room sketches into a cheapest-first furniture shopping plan — visualized in 3D.


---

## The Problem

Furnishing a space is an overwhelming balancing act. Consumers are forced to manually cross-reference room dimensions, design aesthetics, and strict budgets across dozens of websites. While current AI tools can generate beautiful room concepts, they fail to provide practical, affordable, and dimension-accurate purchasing options — leaving budget-conscious users without a usable solution.

## Our Solution

| Pillar | Description |
|--------|-------------|
| **Dimensional Reality** | A vision-to-data engine that translates messy human sketches into strict physical parameters so furniture is guaranteed to fit. |
| **Aesthetic Alignment** | Style-matching AI that ensures the chosen pieces look cohesive without requiring a premium interior designer. |
| **"Cheapest-First" Engine** | A cost-optimization algorithm that forcefully prioritizes the absolute lowest-priced, real-world inventory that satisfies both size and style constraints. |
| **Local Dealer Marketplace** | A built-in dealer portal where local furniture shops sign up and upload inventory — their products are queried **first**, giving small businesses priority visibility. |

---

## How It Works

```
Upload Sketch  ──▶  Set Budget & Style  ──▶  3D Preview  ──▶  Shop & Save
```

1. **Upload / Describe Your Room** — Snap a photo of a hand-drawn sketch, draw directly in the browser, or type a text description (e.g., *"12×14 living room with one door on the north wall"*).
2. **Set Preferences** — Choose a budget ($200–$10k), pick a style (modern, minimalist, scandinavian, industrial, bohemian, farmhouse, mid-century, traditional), and set your priority (lowest price, best rated, or best style match).
3. **3D Visualization** — PennyPlan searches for real furniture (local dealer inventory first, then major retailers), runs the cheapest-first placement algorithm, and renders everything in an interactive 3D room. Swap between alternative picks per category on the fly.
4. **Results & Shopping List** — Get a final summary with total cost, under-budget savings, fit score, style score, and a numbered shopping list with direct retailer links.

### For Local Dealers

```
Sign Up  ──▶  Add Inventory  ──▶  Products Shown First to Customers
```

Local furniture dealers visit `/dealers` to register their business and upload their product catalog. Their items are automatically prioritized in search results, giving small businesses first-class visibility alongside major retailers.

---

## Tech Stack

### Frontend & Visualization
- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** with a custom `penny` orange color palette
- **React Three Fiber** + **Three.js** for interactive 3D room rendering
- **three-mesh-bvh** for collision detection and spatial math
- **Framer Motion** for UI animations
- **Zustand** for global state management
- **react-dropzone** for drag-and-drop file uploads
- **lucide-react** for icons

### AI & Processing
- **GPT-4o** via GitHub Models API — parses 2D sketches and text descriptions into structured JSON floorplans (room dimensions, walls, doors, windows, obstacles, furniture categories)
- **OpenAI Embeddings** (`text-embedding-3-small`) for style-based vector matching

### Backend & Data
- **Supabase** (PostgreSQL) for local dealer registration and inventory storage — dealers sign up, upload products, and their items are queried first during furniture search
- **Pinecone** (Serverless Vector DB) for furniture catalog matching with hard metadata filtering (price, dimensions, availability)
- **Python scraper** (Playwright + BeautifulSoup) for scraping real-time pricing from IKEA, Wayfair, Amazon, and Walmart
- **Cost Optimizer** — greedy placement engine that sorts by user priority, checks dimensional fit, avoids overlaps (AABB + clearance), respects door swing zones and window strips, and uses category-aware positioning (beds against walls, rugs centered, etc.)

---

## Project Structure

```
PennyPlan/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Main page — step-based routing
│   │   ├── layout.tsx                # Root layout + metadata
│   │   ├── globals.css               # Global styles + Tailwind
│   │   ├── dealers/
│   │   │   └── page.tsx              # Dealer Portal — signup + inventory UI
│   │   └── api/
│   │       ├── parse-sketch/route.ts # GPT-4o sketch/text → floorplan
│   │       ├── search-furniture/route.ts # Local-first search (Supabase → Pinecone → mock)
│   │       ├── optimize/route.ts     # Cheapest-first placement optimizer
│   │       └── dealers/
│   │           ├── signup/route.ts   # POST — register a local dealer
│   │           └── products/route.ts # POST (add) + GET (list) dealer products
│   ├── components/
│   │   ├── Navbar.tsx                # Sticky nav + step indicator + Dealer Portal link
│   │   ├── SketchUploader.tsx        # 3-tab input (upload / draw / text)
│   │   ├── DrawingCanvas.tsx         # In-browser room drawing tool
│   │   ├── TextRoomInput.tsx         # Text description input + examples
│   │   ├── PreferencesPanel.tsx      # Budget, style, priority selectors
│   │   ├── VisualizePage.tsx         # 3D viewer + alternatives + cards
│   │   ├── RoomViewer3D.tsx          # Three.js 3D room scene
│   │   ├── FurnitureCard.tsx         # Item card (image, price, rating)
│   │   └── ResultsSummary.tsx        # Final shopping list + savings
│   └── lib/
│       ├── store.ts                  # Zustand global state
│       ├── types.ts                  # TypeScript types (+ LocalDealer, LocalProduct)
│       ├── ai/sketchParser.ts        # GPT-4o API wrapper
│       ├── matching/pineconeClient.ts # Pinecone client + mock catalog
│       ├── optimization/costOptimizer.ts # Placement algorithm
│       ├── scraper/retailScraper.ts  # Scraper config stubs
│       └── supabase/
│           ├── client.ts             # Lazy-init Supabase client + config check
│           └── localProducts.ts      # searchLocalProducts() + 10-item mock catalog
├── supabase/
│   ├── schema.sql                    # local_dealers + local_products DDL + RLS
│   └── seed.sql                      # 4 dealers + 10 handcrafted seed products
├── scripts/
│   └── scraper.py                    # Python scraper (IKEA → Pinecone)
├── public/models/                    # Placeholder for 3D .glb models
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** or **yarn**
- A **GitHub Personal Access Token** (Classic) with the `models:read` scope

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/PennyPlan.git
cd PennyPlan

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Required — powers GPT-4o sketch/text parsing via GitHub Models
GITHUB_TOKEN=your_github_pat_here

# Optional — enables Pinecone vector search (falls back to mock data if unset)
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=pennyplan-furniture

# Optional — alternative embedding provider (GitHub token is preferred)
OPENAI_API_KEY=your_openai_key

# Optional — enables Supabase-backed local dealer inventory
# (falls back to 10 built-in mock local products if unset)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note:** The app works without Pinecone/OpenAI/Supabase keys. The furniture search API falls back to built-in mock catalogs — 13 global items (IKEA, Walmart, Amazon) plus 10 local dealer items (handcrafted, artisan products). Only `GITHUB_TOKEN` is needed for the AI parsing feature.

### Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Verify GitHub Models Access

```bash
curl https://models.inference.ai.azure.com/chat/completions \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Say hello"}],"max_tokens":10}'
```

A valid JSON response confirms your token works.

---

## Scraper (Optional)

The Python scraper populates a Pinecone index with real furniture data from IKEA:

```bash
# Install Python dependencies
pip install playwright beautifulsoup4 pinecone-client openai

# Run the scraper
python scripts/scraper.py
```

This is optional — the app uses mock data by default for the prototype.

---

## Local Dealer Portal

PennyPlan includes a secondary interface at **`/dealers`** where local furniture dealers can sign up and upload their inventory.

### How It Works

1. **Sign Up** — A dealer visits `/dealers`, fills in business name, contact details, and location.
2. **Add Products** — After registration, the dealer sees an inventory dashboard where they can add products with name, category, price, dimensions (W×D×H in inches), style tags, color, image URL, and description.
3. **Automatic Priority** — When customers search for furniture, the search API queries **local dealer products first** (via Supabase), then merges global results (Pinecone/mock). Local items always appear at the top.

### Database Schema

Two Supabase tables power the dealer portal:

| Table | Key Columns |
|-------|-------------|
| `local_dealers` | `id`, `business_name`, `owner_name`, `email`, `city`, `state`, `website` |
| `local_products` | `id`, `dealer_id` (FK), `name`, `category`, `price`, `width_in`, `depth_in`, `height_in`, `style_tags[]`, `color`, `rating`, `in_stock`, `image_url` |

To set up the database, run the SQL files in your Supabase SQL editor:

```bash
# 1. Create tables, indexes, and RLS policies
supabase/schema.sql

# 2. Seed 4 demo dealers + 10 handcrafted products
supabase/seed.sql
```

### Demo Mode

Without Supabase credentials, the dealer portal runs in **demo mode**:
- Dealer signup returns a local fake ID — the form works end-to-end.
- Product additions are stored in browser state for the session.
- The search API serves 10 built-in mock local products (e.g., *"Handcrafted Teak Coffee Table — Local Woodworks Co."*).

### Seed Dealers

| Dealer | Location | Sample Products |
|--------|----------|-----------------|
| Local Woodworks Co. | Austin, TX | Teak Coffee Table, Walnut Nightstand, Maple Dresser |
| GreenGrain Furniture | Portland, OR | Reclaimed Pine Bookshelf, Live-Edge Cedar Desk |
| Artisan Home Collective | Santa Fe, NM | Hand-Woven Jute Rug, Bamboo Floor Lamp |
| Harbor Furnishings | Savannah, GA | Linen Accent Chair, Oak Storage Chest, Velvet Sofa |

---

## Key Design Decisions

- **Proxy-box 3D rendering** — Furniture is rendered as color-coded boxes scaled to exact scraped dimensions rather than requiring per-product 3D models. This keeps the prototype lightweight and browser-native with zero GPU requirements.
- **Greedy cheapest-first placement** — The optimizer is intentionally greedy rather than exhaustive. It sorts candidates by the user's priority (price, rating, or style), then places the first item per category that passes all spatial constraints.
- **Door & window awareness** — The placement engine enforces a 3.5 ft clearance zone around doors and 1 ft buffer around windows, ensuring furniture never blocks openings.
- **Mock-first architecture** — Every external dependency (Pinecone, OpenAI embeddings, Supabase) has a built-in mock fallback so the prototype is fully functional with just a GitHub token.
- **Local-first search** — The search API queries Supabase local dealer inventory before the global catalog (Pinecone/mock). Results are merged with local items appearing first, deduplicated by name. This gives small businesses priority visibility without any extra cost.
- **Lazy Supabase initialization** — The Supabase client is only created on first use (not at module import), so placeholder env vars never cause DNS failures at startup.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## License

Built for the AMD Slingshot Hackathon 2026.
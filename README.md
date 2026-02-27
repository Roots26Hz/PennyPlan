# PennyPlan
An AI that gives you the cheapest and good quality home decor options with a drawing of your home layout


The Problem 
Furnishing a space is an overwhelming balancing act. Consumers are forced to manually cross-reference room dimensions, design aesthetics, and strict budgets across dozens of websites. While current AI tools can generate beautiful room concepts, they fail to provide practical, affordable, and dimension-accurate purchasing options, leaving budget-conscious users without a usable solution.


Our Solution
**Dimensional Reality:** A vision-to-data engine that translates messy human sketches into strict physical parameters so furniture is guaranteed to fit.

**Aesthetic Alignment:** Style-matching AI that ensures the chosen pieces look cohesive without requiring a premium interior designer.

**The "Cheapest-First" Engine:** A cost-optimization algorithm that forcefully prioritizes the absolute lowest-priced, real-world inventory that satisfies both the size and style constraints.


Tech Stack
1. Frontend & Visualization (Lightweight & Browser-Native)

Framework: Next.js with Tailwind CSS for a fast, responsive UI.

3D Engine: React Three Fiber (R3F) and Three.js.

Visualization Logic (Proxy & Scale): Dynamically scaling lightweight, generic CC0 .glb proxy models to match exact scraped dimensions, requiring zero dedicated VRAM.

Spatial Math: three-mesh-bvh for real-time collision detection and wall-snapping to prove the furniture physically fits.

2. AI Vision & Processing (The Spatial Engine)

Spatial Ingestion (API): OpenAI GPT-4o (Vision API) or Qwen2-VL to parse the user's 2D hand-drawn sketch and output a structured JSON floorplan (defining room coordinates and scale).

Data Extraction (API): Lightweight LLM (e.g., GPT-4o-mini or Gemini Flash) to read unstructured e-commerce product descriptions and strictly output structured dimensional data (Width, Depth, Height) and pricing.

3. Backend & Data Logistics (The Budget-First Core)

Scraping Pipeline: Python (Playwright/BeautifulSoup) or Node.js (Puppeteer) to scrape real-time pricing and dimensions from mass-market retailers like IKEA and Wayfair.

Database & Matching: Pinecone (Serverless Vector DB) to match aesthetic style embeddings, combined with hard metadata filtering to strictly exclude items over budget or outside spatial constraints.
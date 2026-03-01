# PennyPlan

**Furnish Smart. Spend Less.**

PennyPlan is an AI-powered home furnishing assistant that helps you find the cheapest, quality furniture for your space. Upload a hand-drawn room sketch, set your budget and style preferences, and PennyPlan will find real furniture that fits your room — visualized in 3D.

## How It Works

1. **Upload Sketch** — Snap a photo of your hand-drawn room layout (or describe it via text).
2. **Set Preferences** — Choose your budget, style (modern, minimalist, scandinavian, etc.), and color palette.
3. **AI Optimization** — GPT-4o parses your sketch into a floor plan, then PennyPlan searches for the best-fitting, lowest-cost furniture.
4. **3D Visualization** — See your furnished room in an interactive 3D view before you buy.

## Features

- **Sketch Parsing** — AI extracts room dimensions, walls, doors, and windows from hand-drawn sketches.
- **Smart Furniture Search** — Finds furniture across retailers and local dealers, matched to your room dimensions and budget.
- **Cost Optimization** — Prioritize by price, rating, or style cohesion to get the best value.
- **3D Room Viewer** — Interactive Three.js-powered visualization of your furnished room.
- **Local Dealer Marketplace** — Local furniture dealers can sign up and list their products for discovery.
- **Alternative Suggestions** — Swap items per category to explore different options within your budget.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| 3D | Three.js, React Three Fiber, Drei |
| AI | OpenAI GPT-4o, Vercel AI SDK |
| Vector Search | Pinecone |
| Database | Supabase |
| State | Zustand |
| Animations | Framer Motion |

## Getting Started

```bash
# Clone the repo
git clone https://github.com/<your-username>/PennyPlan.git
cd PennyPlan

# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Prototype

The working prototype is available in the [`prototype_1`](../../tree/prototype_1) branch.

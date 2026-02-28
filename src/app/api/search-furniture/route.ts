import { NextRequest, NextResponse } from "next/server";
import { searchFurniture, getMockFurniture } from "@/lib/matching/pineconeClient";
import type { FurnitureSearchQuery, FurnitureItem } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      categories,
      maxPrice,
      maxWidthIn,
      maxDepthIn,
      style,
      sortBy = "price_asc",
    } = body;

    if (!categories || !Array.isArray(categories) || categories.length === 0 || !maxPrice) {
      return NextResponse.json(
        { error: "Missing required fields: categories (non-empty array), maxPrice" },
        { status: 400 }
      );
    }

    const query: FurnitureSearchQuery = {
      categories,
      maxPrice,
      maxWidthIn,
      maxDepthIn,
      style,
      sortBy,
    };

    // ── 1. Query local dealer inventory FIRST (Supabase / mock) ──────────
    let localResults: FurnitureItem[] = [];
    try {
      const { searchLocalProducts } = await import("@/lib/supabase/localProducts");
      localResults = await searchLocalProducts(query);
    } catch (localErr) {
      console.warn("Local product search failed (non-fatal):", localErr);
    }

    // ── 2. Query global catalog (Pinecone / mock) ────────────────────────
    let globalResults: FurnitureItem[] = [];

    try {
      const hasRealPinecone = process.env.PINECONE_API_KEY &&
        !process.env.PINECONE_API_KEY.startsWith("your_") &&
        process.env.PINECONE_API_KEY.length > 10;
      const hasRealEmbeddings = (process.env.GITHUB_TOKEN && !process.env.GITHUB_TOKEN.startsWith("your_") && process.env.GITHUB_TOKEN.length > 10) ||
        (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith("your_") && process.env.OPENAI_API_KEY.length > 10);

      if (hasRealPinecone && hasRealEmbeddings) {
        globalResults = await searchFurniture(query, `${style} home decor furniture`);
      } else {
        globalResults = getMockFurniture(query);
      }
    } catch (globalErr) {
      console.warn("Global product search failed, using mock:", globalErr);
      globalResults = getMockFurniture(query);
    }

    // ── 3. Merge: local results first, then global, dedup by name ────────
    const seenNames = new Set<string>();
    const merged: FurnitureItem[] = [];

    for (const item of localResults) {
      const key = item.name.toLowerCase();
      if (!seenNames.has(key)) {
        seenNames.add(key);
        merged.push(item);
      }
    }
    for (const item of globalResults) {
      const key = item.name.toLowerCase();
      if (!seenNames.has(key)) {
        seenNames.add(key);
        merged.push(item);
      }
    }

    console.log(`[search-furniture] categories=${categories.join(",")} budget=${maxPrice} → local=${localResults.length} global=${globalResults.length} merged=${merged.length}`);

    return NextResponse.json({ items: merged });
  } catch (error) {
    console.error("Search error:", error);

    // Last-resort fallback: return the global mock catalog unfiltered so the user always sees something
    try {
      const fallback = getMockFurniture({
        categories: ["sofa","chair","table","desk","bed","dresser","bookshelf","nightstand","rug","lamp","storage"],
        maxPrice: 99999,
        sortBy: "price_asc",
      });
      return NextResponse.json({ items: fallback });
    } catch {
      return NextResponse.json({ items: [] }, { status: 500 });
    }
  }
}

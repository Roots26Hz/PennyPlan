import { NextRequest, NextResponse } from "next/server";
import { searchFurniture, getMockFurniture } from "@/lib/matching/pineconeClient";
import type { FurnitureSearchQuery } from "@/lib/types";

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

    if (!categories || !maxPrice) {
      return NextResponse.json(
        { error: "Missing required fields: categories, maxPrice" },
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

    let results;

    // Only try Pinecone when BOTH Pinecone key AND an embedding key are real
    const hasRealPinecone = process.env.PINECONE_API_KEY &&
      !process.env.PINECONE_API_KEY.startsWith("your_") &&
      process.env.PINECONE_API_KEY.length > 10;
    const hasRealEmbeddings = (process.env.GITHUB_TOKEN && !process.env.GITHUB_TOKEN.startsWith("your_") && process.env.GITHUB_TOKEN.length > 10) ||
      (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith("your_") && process.env.OPENAI_API_KEY.length > 10);

    if (hasRealPinecone && hasRealEmbeddings) {
      results = await searchFurniture(query, `${style} home decor furniture`);
    } else {
      results = getMockFurniture(query);
    }

    return NextResponse.json({ items: results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search furniture" },
      { status: 500 }
    );
  }
}

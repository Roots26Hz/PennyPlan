import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import type { FurnitureItem, FurnitureSearchQuery } from "../types";

/**
 * Pinecone-based vector matching for furniture style alignment.
 * Uses OpenAI embeddings to match user's style preference against
 * a furniture catalog stored in Pinecone.
 */

let pineconeClient: Pinecone | null = null;

function getPinecone(): Pinecone {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || "",
    });
  }
  return pineconeClient;
}

/** Check if an env var is a real key (not a placeholder) */
function isRealKey(value: string | undefined): boolean {
  if (!value) return false;
  return !value.startsWith("your_") && value.length > 10;
}

/** Use the same GitHub Models "bait and switch" trick for embeddings */
function getEmbeddingClient(): OpenAI {
  // Prefer GitHub token (free), fall back to OpenAI key if available
  const token = process.env.GITHUB_TOKEN;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (isRealKey(token)) {
    return new OpenAI({
      baseURL: "https://models.inference.ai.azure.com",
      apiKey: token,
    });
  }
  return new OpenAI({ apiKey: openaiKey || "" });
}

/** Generate an embedding vector for a text description */
async function getEmbedding(text: string): Promise<number[]> {
  const response = await getEmbeddingClient().embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

/** 
 * Search Pinecone for furniture items matching the style + constraints.
 * Uses vector similarity for style and metadata filtering for hard constraints (price, size).
 */
export async function searchFurniture(
  query: FurnitureSearchQuery,
  styleDescription: string
): Promise<FurnitureItem[]> {
  try {
    const pc = getPinecone();
    const index = pc.index(process.env.PINECONE_INDEX_NAME || "pennyplan-furniture");

    // Generate style embedding
    const embedding = await getEmbedding(
      `${styleDescription} furniture ${query.categories.join(" ")}`
    );

    // Build metadata filter
    const filter: Record<string, any> = {
      price: { $lte: query.maxPrice },
      category: { $in: query.categories },
      inStock: true,
    };

    if (query.maxWidthIn) {
      filter.widthIn = { $lte: query.maxWidthIn };
    }
    if (query.maxDepthIn) {
      filter.depthIn = { $lte: query.maxDepthIn };
    }

    const results = await index.query({
      vector: embedding,
      topK: 20,
      filter,
      includeMetadata: true,
    });

    // Map Pinecone results to FurnitureItem
    return (results.matches || []).map((match) => {
      const meta = match.metadata as Record<string, any>;
      return {
        id: match.id,
        name: meta.name || "Unknown",
        category: meta.category || "other",
        retailer: meta.retailer || "Unknown",
        price: meta.price || 0,
        currency: "USD",
        url: meta.url || "",
        imageUrl: meta.imageUrl || "",
        dimensions: {
          widthIn: meta.widthIn || 0,
          depthIn: meta.depthIn || 0,
          heightIn: meta.heightIn || 0,
        },
        style: meta.style || [],
        color: meta.color || "",
        rating: meta.rating || 0,
        reviewCount: meta.reviewCount || 0,
        inStock: meta.inStock ?? true,
      };
    });
  } catch (error) {
    console.error("Pinecone search failed, using mock data:", error);
    return getMockFurniture(query);
  }
}

/** Fallback mock data for development/demo without Pinecone */
export function getMockFurniture(query: FurnitureSearchQuery): FurnitureItem[] {
  const mockCatalog: FurnitureItem[] = [
    {
      id: "1",
      name: "KLIPPAN Compact 2-Seat Sofa",
      category: "sofa",
      retailer: "IKEA",
      price: 299,
      currency: "USD",
      url: "https://ikea.com",
      imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop",
      dimensions: { widthIn: 71, depthIn: 34, heightIn: 26 },
      style: ["modern", "minimalist"],
      color: "Gray",
      rating: 4.2,
      reviewCount: 1847,
      inStock: true,
    },
    {
      id: "2",
      name: "FRIHETEN Sleeper Sofa",
      category: "sofa",
      retailer: "IKEA",
      price: 549,
      currency: "USD",
      url: "https://ikea.com",
      imageUrl: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400&h=400&fit=crop",
      dimensions: { widthIn: 90, depthIn: 41, heightIn: 26 },
      style: ["modern", "scandinavian"],
      color: "Dark Gray",
      rating: 4.0,
      reviewCount: 2341,
      inStock: true,
    },
    {
      id: "3",
      name: "Mainstays Classic Coffee Table",
      category: "table",
      retailer: "Walmart",
      price: 45,
      currency: "USD",
      url: "https://walmart.com",
      imageUrl: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400&h=400&fit=crop",
      dimensions: { widthIn: 40, depthIn: 20, heightIn: 17 },
      style: ["modern", "minimalist"],
      color: "Walnut",
      rating: 4.1,
      reviewCount: 3021,
      inStock: true,
    },
    {
      id: "4",
      name: "LACK Side Table",
      category: "table",
      retailer: "IKEA",
      price: 9.99,
      currency: "USD",
      url: "https://ikea.com",
      imageUrl: "https://images.unsplash.com/photo-1499933374294-4584851497cc?w=400&h=400&fit=crop",
      dimensions: { widthIn: 22, depthIn: 22, heightIn: 18 },
      style: ["modern", "minimalist", "scandinavian"],
      color: "White",
      rating: 4.5,
      reviewCount: 5672,
      inStock: true,
    },
    {
      id: "5",
      name: "Simple Designs Floor Lamp",
      category: "lamp",
      retailer: "Amazon",
      price: 22,
      currency: "USD",
      url: "https://amazon.com",
      imageUrl: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=400&fit=crop",
      dimensions: { widthIn: 10, depthIn: 10, heightIn: 58 },
      style: ["modern", "minimalist"],
      color: "Black",
      rating: 4.3,
      reviewCount: 8901,
      inStock: true,
    },
    {
      id: "6",
      name: "KALLAX Shelf Unit 4x2",
      category: "bookshelf",
      retailer: "IKEA",
      price: 69.99,
      currency: "USD",
      url: "https://ikea.com",
      imageUrl: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&h=400&fit=crop",
      dimensions: { widthIn: 30, depthIn: 15, heightIn: 57 },
      style: ["modern", "scandinavian", "minimalist"],
      color: "White",
      rating: 4.6,
      reviewCount: 4215,
      inStock: true,
    },
    {
      id: "7",
      name: "Nourison Essentials Area Rug 5x7",
      category: "rug",
      retailer: "Amazon",
      price: 59,
      currency: "USD",
      url: "https://amazon.com",
      imageUrl: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=400&h=400&fit=crop",
      dimensions: { widthIn: 84, depthIn: 60, heightIn: 1 },
      style: ["modern", "minimalist", "bohemian"],
      color: "Ivory",
      rating: 4.4,
      reviewCount: 2154,
      inStock: true,
    },
    {
      id: "8",
      name: "POÄNG Armchair",
      category: "chair",
      retailer: "IKEA",
      price: 99,
      currency: "USD",
      url: "https://ikea.com",
      imageUrl: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=400&fit=crop",
      dimensions: { widthIn: 26, depthIn: 32, heightIn: 39 },
      style: ["scandinavian", "modern"],
      color: "Birch/Black",
      rating: 4.7,
      reviewCount: 6789,
      inStock: true,
    },
    {
      id: "9",
      name: "MALM 6-Drawer Dresser",
      category: "dresser",
      retailer: "IKEA",
      price: 199,
      currency: "USD",
      url: "https://ikea.com",
      imageUrl: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=400&h=400&fit=crop",
      dimensions: { widthIn: 63, depthIn: 19, heightIn: 30 },
      style: ["modern", "minimalist", "scandinavian"],
      color: "White",
      rating: 4.1,
      reviewCount: 3456,
      inStock: true,
    },
    {
      id: "10",
      name: "HEMNES Nightstand",
      category: "nightstand",
      retailer: "IKEA",
      price: 79.99,
      currency: "USD",
      url: "https://ikea.com",
      imageUrl: "https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=400&h=400&fit=crop",
      dimensions: { widthIn: 18, depthIn: 14, heightIn: 27 },
      style: ["traditional", "farmhouse"],
      color: "White Stain",
      rating: 4.3,
      reviewCount: 2987,
      inStock: true,
    },
    {
      id: "11",
      name: "MICKE Desk",
      category: "desk",
      retailer: "IKEA",
      price: 89.99,
      currency: "USD",
      url: "https://ikea.com",
      imageUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&h=400&fit=crop",
      dimensions: { widthIn: 41, depthIn: 20, heightIn: 30 },
      style: ["modern", "minimalist"],
      color: "White",
      rating: 4.2,
      reviewCount: 4321,
      inStock: true,
    },
    {
      id: "12",
      name: "TROFAST Storage Combination",
      category: "storage",
      retailer: "IKEA",
      price: 57,
      currency: "USD",
      url: "https://ikea.com",
      imageUrl: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&h=400&fit=crop",
      dimensions: { widthIn: 39, depthIn: 17, heightIn: 22 },
      style: ["scandinavian", "modern"],
      color: "Pine/White",
      rating: 4.5,
      reviewCount: 1876,
      inStock: true,
    },
    {
      id: "13",
      name: "SLATTUM Upholstered Bed Frame (Full)",
      category: "bed",
      retailer: "IKEA",
      price: 149,
      currency: "USD",
      url: "https://ikea.com",
      imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
      dimensions: { widthIn: 56, depthIn: 77, heightIn: 33 },
      style: ["modern", "minimalist"],
      color: "Gray",
      rating: 4.0,
      reviewCount: 1543,
      inStock: true,
    },
  ];

  return mockCatalog
    .filter((item) => {
      if (!query.categories.includes(item.category)) return false;
      if (item.price > query.maxPrice) return false;
      if (query.maxWidthIn && item.dimensions.widthIn > query.maxWidthIn) return false;
      if (query.maxDepthIn && item.dimensions.depthIn > query.maxDepthIn) return false;
      return true;
    })
    .sort((a, b) => {
      if (query.sortBy === "price_asc") return a.price - b.price;
      if (query.sortBy === "price_desc") return b.price - a.price;
      if (query.sortBy === "rating") return b.rating - a.rating;
      return 0;
    });
}

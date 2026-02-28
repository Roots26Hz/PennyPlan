import { supabase, isSupabaseConfigured } from "./client";
import type { FurnitureItem, FurnitureCategory, FurnitureSearchQuery } from "../types";
import type { LocalProduct, LocalDealer } from "../types";

// ─── Supabase queries ────────────────────────────────────────────────────────

/**
 * Search local dealer products from Supabase first.
 * Returns FurnitureItem[] that match the given search constraints.
 * Falls back to the in-memory mock local catalog when Supabase is not configured.
 */
export async function searchLocalProducts(
  query: FurnitureSearchQuery
): Promise<FurnitureItem[]> {
  if (!isSupabaseConfigured()) {
    return getLocalMockProducts(query);
  }

  try {
    let q = supabase
      .from("local_products")
      .select("*, local_dealers(business_name, city, state)")
      .eq("in_stock", true)
      .lte("price", query.maxPrice)
      .in("category", query.categories);

    if (query.maxWidthIn) {
      q = q.lte("width_in", query.maxWidthIn);
    }
    if (query.maxDepthIn) {
      q = q.lte("depth_in", query.maxDepthIn);
    }

    // Ordering
    if (query.sortBy === "price_asc") q = q.order("price", { ascending: true });
    else if (query.sortBy === "price_desc") q = q.order("price", { ascending: false });
    else if (query.sortBy === "rating") q = q.order("rating", { ascending: false });
    else q = q.order("price", { ascending: true });

    const { data, error } = await q.limit(20);

    if (error) {
      console.error("Supabase local product search failed:", error);
      return getLocalMockProducts(query);
    }

    return (data || []).map(rowToFurnitureItem);
  } catch (err) {
    console.error("Supabase local search error:", err);
    return getLocalMockProducts(query);
  }
}

/** Convert a Supabase row into a FurnitureItem */
function rowToFurnitureItem(row: any): FurnitureItem {
  const dealer = row.local_dealers;
  const dealerName = dealer?.business_name || "Local Dealer";
  const location = dealer ? `${dealer.city}, ${dealer.state}` : "";

  return {
    id: `local-${row.id}`,
    name: row.name,
    category: row.category as FurnitureCategory,
    retailer: `${dealerName}${location ? ` (${location})` : ""}`,
    price: row.price,
    currency: "USD",
    url: row.product_url || "",
    imageUrl: row.image_url || "",
    dimensions: {
      widthIn: row.width_in || 0,
      depthIn: row.depth_in || 0,
      heightIn: row.height_in || 0,
    },
    style: row.style_tags || [],
    color: row.color || "",
    rating: row.rating || 0,
    reviewCount: row.review_count || 0,
    inStock: row.in_stock ?? true,
  };
}

// ─── In-memory mock local products ──────────────────────────────────────────

const LOCAL_MOCK_CATALOG: FurnitureItem[] = [
  {
    id: "local-1",
    name: "Handcrafted Teak Coffee Table",
    category: "table",
    retailer: "Local Woodworks Co. (Austin, TX)",
    price: 185,
    currency: "USD",
    url: "",
    imageUrl: "https://images.unsplash.com/photo-1611486212557-88be5ff6f941?w=400&h=400&fit=crop",
    dimensions: { widthIn: 42, depthIn: 22, heightIn: 16 },
    style: ["farmhouse", "mid-century"],
    color: "Natural Teak",
    rating: 4.8,
    reviewCount: 34,
    inStock: true,
  },
  {
    id: "local-2",
    name: "Reclaimed Pine Bookshelf",
    category: "bookshelf",
    retailer: "GreenGrain Furniture (Portland, OR)",
    price: 220,
    currency: "USD",
    url: "",
    imageUrl: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&h=400&fit=crop",
    dimensions: { widthIn: 32, depthIn: 12, heightIn: 60 },
    style: ["industrial", "farmhouse"],
    color: "Weathered Brown",
    rating: 4.6,
    reviewCount: 18,
    inStock: true,
  },
  {
    id: "local-3",
    name: "Hand-Woven Jute Area Rug 5x7",
    category: "rug",
    retailer: "Artisan Home Collective (Santa Fe, NM)",
    price: 95,
    currency: "USD",
    url: "",
    imageUrl: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=400&h=400&fit=crop",
    dimensions: { widthIn: 84, depthIn: 60, heightIn: 1 },
    style: ["bohemian", "farmhouse"],
    color: "Natural",
    rating: 4.7,
    reviewCount: 22,
    inStock: true,
  },
  {
    id: "local-4",
    name: "Mid-Century Walnut Nightstand",
    category: "nightstand",
    retailer: "Local Woodworks Co. (Austin, TX)",
    price: 135,
    currency: "USD",
    url: "",
    imageUrl: "https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=400&h=400&fit=crop",
    dimensions: { widthIn: 18, depthIn: 15, heightIn: 24 },
    style: ["mid-century", "modern"],
    color: "Walnut",
    rating: 4.9,
    reviewCount: 12,
    inStock: true,
  },
  {
    id: "local-5",
    name: "Upholstered Linen Accent Chair",
    category: "chair",
    retailer: "Harbor Furnishings (Savannah, GA)",
    price: 275,
    currency: "USD",
    url: "",
    imageUrl: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=400&fit=crop",
    dimensions: { widthIn: 28, depthIn: 30, heightIn: 34 },
    style: ["traditional", "farmhouse"],
    color: "Oatmeal",
    rating: 4.5,
    reviewCount: 9,
    inStock: true,
  },
  {
    id: "local-6",
    name: "Live-Edge Cedar Desk",
    category: "desk",
    retailer: "GreenGrain Furniture (Portland, OR)",
    price: 310,
    currency: "USD",
    url: "",
    imageUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&h=400&fit=crop",
    dimensions: { widthIn: 48, depthIn: 24, heightIn: 30 },
    style: ["industrial", "modern"],
    color: "Natural Cedar",
    rating: 4.8,
    reviewCount: 7,
    inStock: true,
  },
  {
    id: "local-7",
    name: "Bamboo Floor Lamp with Linen Shade",
    category: "lamp",
    retailer: "Artisan Home Collective (Santa Fe, NM)",
    price: 68,
    currency: "USD",
    url: "",
    imageUrl: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=400&fit=crop",
    dimensions: { widthIn: 12, depthIn: 12, heightIn: 60 },
    style: ["bohemian", "scandinavian"],
    color: "Natural/White",
    rating: 4.4,
    reviewCount: 15,
    inStock: true,
  },
  {
    id: "local-8",
    name: "Rustic Oak Storage Chest",
    category: "storage",
    retailer: "Harbor Furnishings (Savannah, GA)",
    price: 199,
    currency: "USD",
    url: "",
    imageUrl: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&h=400&fit=crop",
    dimensions: { widthIn: 36, depthIn: 18, heightIn: 20 },
    style: ["farmhouse", "traditional"],
    color: "Honey Oak",
    rating: 4.6,
    reviewCount: 11,
    inStock: true,
  },
  {
    id: "local-9",
    name: "Custom-Stained Maple Dresser",
    category: "dresser",
    retailer: "Local Woodworks Co. (Austin, TX)",
    price: 420,
    currency: "USD",
    url: "",
    imageUrl: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=400&h=400&fit=crop",
    dimensions: { widthIn: 54, depthIn: 18, heightIn: 32 },
    style: ["mid-century", "modern"],
    color: "Maple",
    rating: 4.9,
    reviewCount: 6,
    inStock: true,
  },
  {
    id: "local-10",
    name: "Handmade Velvet Sofa — 3-Seat",
    category: "sofa",
    retailer: "Harbor Furnishings (Savannah, GA)",
    price: 650,
    currency: "USD",
    url: "",
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop",
    dimensions: { widthIn: 78, depthIn: 34, heightIn: 28 },
    style: ["bohemian", "modern"],
    color: "Emerald Green",
    rating: 4.7,
    reviewCount: 14,
    inStock: true,
  },
];

/** Fallback: in-memory local mock products */
export function getLocalMockProducts(
  query: FurnitureSearchQuery
): FurnitureItem[] {
  return LOCAL_MOCK_CATALOG.filter((item) => {
    if (!query.categories.includes(item.category)) return false;
    if (item.price > query.maxPrice) return false;
    if (query.maxWidthIn && item.dimensions.widthIn > query.maxWidthIn) return false;
    if (query.maxDepthIn && item.dimensions.depthIn > query.maxDepthIn) return false;
    return true;
  }).sort((a, b) => {
    if (query.sortBy === "price_asc") return a.price - b.price;
    if (query.sortBy === "price_desc") return b.price - a.price;
    if (query.sortBy === "rating") return b.rating - a.rating;
    return 0;
  });
}

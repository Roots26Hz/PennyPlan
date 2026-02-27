// ============================================
// PennyPlan Core Type Definitions
// ============================================

/** Parsed room dimensions from a sketch */
export interface FloorPlan {
  roomName: string;
  widthFt: number;
  lengthFt: number;
  heightFt: number;
  walls: Wall[];
  obstacles: Obstacle[];
  openings: Opening[];
}

export interface Wall {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  lengthFt: number;
}

export interface Obstacle {
  id: string;
  type: "column" | "radiator" | "fireplace" | "other";
  x: number;
  y: number;
  widthFt: number;
  depthFt: number;
}

export interface Opening {
  id: string;
  type: "door" | "window";
  wallId: string;
  positionAlongWall: number; // 0-1 fraction
  widthFt: number;
  heightFt: number;
}

/** A furniture item from scraping */
export interface FurnitureItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  retailer: string;
  price: number;
  currency: string;
  url: string;
  imageUrl: string;
  dimensions: {
    widthIn: number;
    depthIn: number;
    heightIn: number;
  };
  style: string[];
  color: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

export type FurnitureCategory =
  | "sofa"
  | "chair"
  | "table"
  | "desk"
  | "bed"
  | "dresser"
  | "bookshelf"
  | "nightstand"
  | "rug"
  | "lamp"
  | "storage"
  | "other";

/** User's design preferences */
export interface DesignPreferences {
  budget: number;
  style: StylePreference;
  colorPalette: string[];
  prioritize: "price" | "rating" | "style";
}

export type StylePreference =
  | "modern"
  | "minimalist"
  | "scandinavian"
  | "industrial"
  | "bohemian"
  | "traditional"
  | "mid-century"
  | "farmhouse";

/** A placed furniture item in the 3D scene */
export interface PlacedFurniture {
  item: FurnitureItem;
  position: { x: number; y: number; z: number };
  rotation: number; // degrees around Y axis
  fits: boolean;
}

/** Result from the optimization engine */
export interface OptimizationResult {
  totalCost: number;
  items: PlacedFurniture[];
  savings: number; // vs average market price
  fitScore: number; // 0-100, how well items fit the room
  styleScore: number; // 0-100, aesthetic cohesion
}

/** Sketch parsing result from GPT-4o */
export interface SketchParseResult {
  floorPlan: FloorPlan;
  suggestedCategories: FurnitureCategory[];
  confidence: number;
  rawResponse: string;
}

/** Input mode for room specification */
export type InputMode = "upload" | "draw" | "text";

/** Category-level color map for 3D visualization */
export const CATEGORY_COLORS: Record<FurnitureCategory, string> = {
  bed: "#ef4444",        // red
  dresser: "#f59e0b",    // amber/yellow
  table: "#f97316",      // orange
  sofa: "#3b82f6",       // blue
  chair: "#8b5cf6",      // violet
  desk: "#06b6d4",       // cyan
  bookshelf: "#10b981",  // emerald
  nightstand: "#ec4899", // pink
  rug: "#a3e635",        // lime
  lamp: "#fbbf24",       // yellow
  storage: "#6366f1",    // indigo
  other: "#78716c",      // stone
};

export const CATEGORY_COLORS_BORDER: Record<FurnitureCategory, string> = {
  bed: "#b91c1c",
  dresser: "#b45309",
  table: "#c2410c",
  sofa: "#1d4ed8",
  chair: "#6d28d9",
  desk: "#0e7490",
  bookshelf: "#047857",
  nightstand: "#be185d",
  rug: "#65a30d",
  lamp: "#d97706",
  storage: "#4338ca",
  other: "#57534e",
};

/** Alternative furniture suggestion per category slot */
export interface FurnitureAlternatives {
  category: FurnitureCategory;
  options: FurnitureItem[];      // all candidates for this category
  selectedIndex: number;         // which one is currently selected (0 or 1)
}

/** Search query for furniture matching */
export interface FurnitureSearchQuery {
  categories: FurnitureCategory[];
  maxPrice: number;
  maxWidthIn?: number;
  maxDepthIn?: number;
  style?: StylePreference;
  sortBy: "price_asc" | "price_desc" | "rating" | "relevance";
}

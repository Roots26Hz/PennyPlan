import { NextRequest, NextResponse } from "next/server";
import { optimizeFurniture } from "@/lib/optimization/costOptimizer";
import type { FurnitureItem, FloorPlan, DesignPreferences } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidates, floorPlan, preferences } = body as {
      candidates: FurnitureItem[];
      floorPlan: FloorPlan;
      preferences: DesignPreferences;
    };

    if (!candidates || !floorPlan || !preferences) {
      return NextResponse.json(
        { error: "Missing required fields: candidates, floorPlan, preferences" },
        { status: 400 }
      );
    }

    const result = optimizeFurniture(candidates, floorPlan, preferences);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Optimization error:", error);
    return NextResponse.json(
      { error: "Failed to optimize furniture layout" },
      { status: 500 }
    );
  }
}

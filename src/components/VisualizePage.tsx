"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import dynamic from "next/dynamic";
import FurnitureCard from "@/components/FurnitureCard";
import {
  Loader2,
  Package,
  DollarSign,
  Maximize,
  Sparkles,
  ArrowRight,
  ArrowLeftRight,
} from "lucide-react";
import type {
  FurnitureItem,
  FurnitureCategory,
  OptimizationResult,
  PlacedFurniture,
  FurnitureAlternatives,
} from "@/lib/types";
import { CATEGORY_COLORS, CATEGORY_COLORS_BORDER } from "@/lib/types";

// Dynamic import for Three.js (no SSR)
const RoomViewer3D = dynamic(() => import("@/components/RoomViewer3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center rounded-2xl border border-stone-200 bg-stone-100">
      <Loader2 className="animate-spin text-penny-500" size={32} />
    </div>
  ),
});

/** Build alternatives: group search results by category, pick top 2 per category */
function buildAlternatives(
  searchResults: FurnitureItem[],
  optimizationResult: OptimizationResult
): FurnitureAlternatives[] {
  const placedCategories = new Set(
    optimizationResult.items.map((p) => p.item.category)
  );

  const catMap = new Map<FurnitureCategory, FurnitureItem[]>();
  for (const item of searchResults) {
    if (!placedCategories.has(item.category)) continue;
    const arr = catMap.get(item.category) || [];
    arr.push(item);
    catMap.set(item.category, arr);
  }

  const alts: FurnitureAlternatives[] = [];
  Array.from(catMap.entries()).forEach(([category, items]) => {
    // Ensure the currently-placed item is option 0, next-best is option 1
    const placedItem = optimizationResult.items.find(
      (p) => p.item.category === category
    );
    const placedId = placedItem?.item.id;
    const others = items.filter((it) => it.id !== placedId);

    const options: FurnitureItem[] = [];
    if (placedItem) options.push(placedItem.item);
    if (others.length > 0) options.push(others[0]);

    if (options.length >= 2) {
      alts.push({ category, options, selectedIndex: 0 });
    }
  });

  return alts;
}

/** Produce a new placed-furniture list by swapping items according to alternatives */
function applyAlternatives(
  baseResult: OptimizationResult,
  alternatives: FurnitureAlternatives[]
): PlacedFurniture[] {
  return baseResult.items.map((placed) => {
    const alt = alternatives.find((a) => a.category === placed.item.category);
    if (!alt) return placed;
    const selectedItem = alt.options[alt.selectedIndex];
    if (!selectedItem || selectedItem.id === placed.item.id) return placed;
    // Swap the item but keep position/rotation/fits
    return { ...placed, item: selectedItem };
  });
}

export default function VisualizePage() {
  const {
    parseResult,
    preferences,
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,
    optimizationResult,
    setOptimizationResult,
    isOptimizing,
    setIsOptimizing,
    setStep,
    alternatives,
    setAlternatives,
    swapAlternative,
  } = useStore();

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [hoverCategory, setHoverCategory] = useState<FurnitureCategory | null>(null);

  // Search for furniture on mount
  useEffect(() => {
    if (!parseResult || searchResults.length > 0) return;

    const doSearch = async () => {
      setIsSearching(true);
      try {
        // Ensure we have valid categories to search
        const categories = parseResult.suggestedCategories;
        if (!categories || categories.length === 0) {
          console.warn("No suggested categories from parse result, using defaults");
        }
        const safeCategories =
          categories && categories.length > 0
            ? categories
            : ["sofa", "table", "chair", "lamp", "rug", "bookshelf"];

        const res = await fetch("/api/search-furniture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categories: safeCategories,
            maxPrice: preferences.budget || 2000,
            style: preferences.style || "modern",
            sortBy:
              preferences.prioritize === "price" ? "price_asc" : "rating",
          }),
        });

        if (!res.ok) {
          console.error("Search API returned", res.status, await res.text());
          return;
        }

        const data = await res.json();
        console.log(`[VisualizePage] search returned ${(data.items || []).length} items`);
        setSearchResults(data.items || []);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    };

    doSearch();
  }, [parseResult]);

  // Auto-optimize when search results arrive
  useEffect(() => {
    if (searchResults.length === 0 || optimizationResult || !parseResult) return;

    const doOptimize = async () => {
      setIsOptimizing(true);
      try {
        const res = await fetch("/api/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidates: searchResults,
            floorPlan: parseResult.floorPlan,
            preferences,
          }),
        });
        const data: OptimizationResult = await res.json();
        setOptimizationResult(data);

        // Auto-select optimized items
        const ids = new Set(data.items.map((i) => i.item.id));
        setSelectedItems(ids);

        // Build alternatives (two options per category)
        const alts = buildAlternatives(searchResults, data);
        setAlternatives(alts);
      } catch (err) {
        console.error("Optimization failed:", err);
      } finally {
        setIsOptimizing(false);
      }
    };

    doOptimize();
  }, [searchResults]);

  const toggleItem = (item: FurnitureItem) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  if (!parseResult) {
    return (
      <div className="py-20 text-center text-stone-400">
        No room data. Please upload a sketch first.
      </div>
    );
  }

  const floorPlan = parseResult.floorPlan;

  // Compute the displayed furniture list, applying any swaps
  const displayedFurniture = optimizationResult
    ? applyAlternatives(optimizationResult, alternatives)
    : [];

  // Compute updated total cost after swaps
  const displayedTotalCost = displayedFurniture.reduce(
    (sum, pf) => sum + pf.item.price,
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-stone-800">
          Your Room — Optimized
        </h2>
        <p className="mt-2 text-stone-500">
          {floorPlan.roomName} • {floorPlan.widthFt}&apos; × {floorPlan.lengthFt}&apos; •
          Budget: ${preferences.budget.toLocaleString()}
        </p>
      </div>

      {/* Stats Bar */}
      {optimizationResult && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
            <DollarSign className="mx-auto mb-1 text-green-500" size={24} />
            <p className="text-2xl font-bold text-stone-800">
              ${displayedTotalCost.toFixed(0)}
            </p>
            <p className="text-xs text-stone-400">Total Cost</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
            <Package className="mx-auto mb-1 text-penny-500" size={24} />
            <p className="text-2xl font-bold text-stone-800">
              {optimizationResult.items.length}
            </p>
            <p className="text-xs text-stone-400">Items</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
            <Maximize className="mx-auto mb-1 text-blue-500" size={24} />
            <p className="text-2xl font-bold text-stone-800">
              {optimizationResult.fitScore}%
            </p>
            <p className="text-xs text-stone-400">Fit Score</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
            <Sparkles className="mx-auto mb-1 text-purple-500" size={24} />
            <p className="text-2xl font-bold text-stone-800">
              {optimizationResult.styleScore}%
            </p>
            <p className="text-xs text-stone-400">Style Match</p>
          </div>
        </div>
      )}

      {/* 3D Viewer + Alternatives Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <h3 className="mb-3 text-lg font-semibold text-stone-700">
            3D Room Preview
          </h3>
          <RoomViewer3D
            floorPlan={floorPlan}
            placedFurniture={displayedFurniture}
            highlightCategory={hoverCategory}
          />
          <p className="mt-2 text-center text-xs text-stone-400">
            Drag to rotate • Scroll to zoom • Color-coded by category
          </p>
        </div>

        {/* Alternatives Swap Panel */}
        {alternatives.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-stone-700">
              Swap Suggestions
            </h3>
            <p className="text-xs text-stone-400">
              Toggle between two options per category. Changes appear instantly in
              the 3D view.
            </p>
            <div className="space-y-2">
              {alternatives.map((alt) => {
                const current = alt.options[alt.selectedIndex];
                const other = alt.options[alt.selectedIndex === 0 ? 1 : 0];
                const catColor = CATEGORY_COLORS[alt.category];
                const catBorder = CATEGORY_COLORS_BORDER[alt.category];

                return (
                  <div
                    key={alt.category}
                    className="rounded-xl border bg-white p-3 transition-shadow hover:shadow-md"
                    style={{ borderColor: catBorder }}
                    onMouseEnter={() => setHoverCategory(alt.category)}
                    onMouseLeave={() => setHoverCategory(null)}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-sm"
                        style={{ backgroundColor: catColor }}
                      />
                      <span className="text-sm font-semibold capitalize text-stone-700">
                        {alt.category}
                      </span>
                    </div>

                    {/* Currently selected */}
                    <div className="mb-1.5 rounded-lg bg-stone-50 px-3 py-2">
                      <p className="text-xs font-medium text-stone-800 truncate">
                        {current?.name}
                      </p>
                      <p className="text-xs text-stone-500">
                        ${current?.price.toFixed(2)} • {current?.retailer}
                      </p>
                    </div>

                    {/* Swap button */}
                    <button
                      onClick={() => swapAlternative(alt.category)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-penny-50 hover:text-penny-600 hover:border-penny-200"
                    >
                      <ArrowLeftRight size={14} />
                      Switch to: {other?.name?.slice(0, 28)}
                      {other && other.name.length > 28 ? "…" : ""} ($
                      {other?.price.toFixed(2)})
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Furniture Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-700">
            {isSearching
              ? "Searching for cheapest options..."
              : `Found ${searchResults.length} items`}
          </h3>
          {isOptimizing && (
            <div className="flex items-center gap-2 text-sm text-penny-500">
              <Loader2 className="animate-spin" size={16} />
              Optimizing layout...
            </div>
          )}
        </div>

        {isSearching ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-penny-500" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {searchResults.map((item) => {
              const placedItem = optimizationResult?.items.find(
                (p) => p.item.id === item.id
              );
              return (
                <FurnitureCard
                  key={item.id}
                  item={item}
                  fits={
                    placedItem?.fits ??
                    (item.dimensions.widthIn / 12 <= floorPlan.widthFt &&
                      item.dimensions.depthIn / 12 <= floorPlan.lengthFt)
                  }
                  selected={selectedItems.has(item.id)}
                  onSelect={toggleItem}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Continue to Results */}
      {optimizationResult && (
        <div className="text-center">
          <button
            onClick={() => setStep("results")}
            className="mx-auto flex items-center gap-2 rounded-xl bg-penny-500 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-penny-500/25 transition-all hover:bg-penny-600 hover:shadow-xl"
          >
            View Final Plan
            <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

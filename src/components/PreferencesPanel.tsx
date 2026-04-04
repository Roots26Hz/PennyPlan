"use client";

import { useStore } from "@/lib/store";
import type { StylePreference, FloorPlan } from "@/lib/types";
import { DollarSign, Palette, Sparkles, ArrowRight, Ruler, Armchair } from "lucide-react";

const STYLES: { value: StylePreference; label: string; emoji: string }[] = [
  { value: "modern", label: "Modern", emoji: "🏙️" },
  { value: "minimalist", label: "Minimalist", emoji: "◻️" },
  { value: "scandinavian", label: "Scandinavian", emoji: "🌿" },
  { value: "industrial", label: "Industrial", emoji: "🏗️" },
  { value: "bohemian", label: "Bohemian", emoji: "🎨" },
  { value: "mid-century", label: "Mid-Century", emoji: "🪑" },
  { value: "farmhouse", label: "Farmhouse", emoji: "🏡" },
  { value: "traditional", label: "Traditional", emoji: "🏛️" },
];

export default function PreferencesPanel() {
  const { preferences, setPreferences, setStep, parseResult, setParseResult } = useStore();

  const getResizedRectWalls = (
    currentFloorPlan: FloorPlan,
    widthFt: number,
    lengthFt: number
  ) => {
    const wallIds = currentFloorPlan.walls?.map((w) => w.id) || [];
    const ids = [
      wallIds[0] || "w1",
      wallIds[1] || "w2",
      wallIds[2] || "w3",
      wallIds[3] || "w4",
    ];

    return [
      { id: ids[0], startX: 0, startY: 0, endX: widthFt, endY: 0, lengthFt: widthFt },
      { id: ids[1], startX: widthFt, startY: 0, endX: widthFt, endY: lengthFt, lengthFt: lengthFt },
      { id: ids[2], startX: widthFt, startY: lengthFt, endX: 0, endY: lengthFt, lengthFt: widthFt },
      { id: ids[3], startX: 0, startY: lengthFt, endX: 0, endY: 0, lengthFt: lengthFt },
    ];
  };

  const handleDimensionChange = (
    key: "widthFt" | "lengthFt" | "heightFt",
    rawValue: string
  ) => {
    if (!parseResult) return;

    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return;
    const nextValue = Math.max(4, Math.min(60, parsed));

    const current = parseResult.floorPlan;
    const nextFloorPlan: FloorPlan = {
      ...current,
      [key]: nextValue,
    };

    if (key === "widthFt" || key === "lengthFt") {
      nextFloorPlan.walls = getResizedRectWalls(
        nextFloorPlan,
        key === "widthFt" ? nextValue : current.widthFt,
        key === "lengthFt" ? nextValue : current.lengthFt
      );
    }

    setParseResult({
      ...parseResult,
      floorPlan: nextFloorPlan,
    });
  };

  const handleSearch = async () => {
    setStep("visualize");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-stone-800">
          Set Your Preferences
        </h2>
        <p className="mt-2 text-stone-500">
          Tell us your budget and style — we&apos;ll find the cheapest pieces
          that fit and look great.
        </p>
      </div>

      {/* Room Summary */}
      {parseResult && (
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Ruler className="text-penny-500" size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
              Room Dimensions (Editable)
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {(
              [
                { key: "widthFt", label: "Width", value: parseResult.floorPlan.widthFt },
                { key: "lengthFt", label: "Length", value: parseResult.floorPlan.lengthFt },
                { key: "heightFt", label: "Height", value: parseResult.floorPlan.heightFt },
              ] as const
            ).map((dim) => (
              <label key={dim.key} className="text-center">
                <p className="mb-1 text-xs text-stone-400">{dim.label}</p>
                <div className="flex items-center justify-center gap-1">
                  <input
                    type="number"
                    min={4}
                    max={60}
                    step={0.5}
                    value={dim.value}
                    onChange={(e) => handleDimensionChange(dim.key, e.target.value)}
                    className="w-20 rounded-lg border border-stone-300 bg-white px-2 py-1 text-center text-lg font-semibold text-stone-800 outline-none ring-penny-200 focus:ring-2"
                  />
                  <span className="text-sm text-stone-500">ft</span>
                </div>
              </label>
            ))}
          </div>
          <div className="mt-3 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
            Adjust these values if the AI dimensions are slightly off.
          </div>
        </div>
      )}

      {/* Budget Slider */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <DollarSign className="text-penny-500" size={20} />
          <h3 className="text-lg font-semibold text-stone-800">Budget</h3>
        </div>
        <div className="space-y-3">
          <input
            type="range"
            min={200}
            max={10000}
            step={100}
            value={preferences.budget}
            onChange={(e) =>
              setPreferences({ budget: Number(e.target.value) })
            }
            className="w-full accent-penny-500"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-400">$200</span>
            <span className="rounded-lg bg-penny-100 px-4 py-1 text-xl font-bold text-penny-600">
              ${preferences.budget.toLocaleString()}
            </span>
            <span className="text-sm text-stone-400">$10,000</span>
          </div>
        </div>
      </div>

      {/* Furniture Selection */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Armchair className="text-penny-500" size={20} />
          <h3 className="text-lg font-semibold text-stone-800">Furniture Selection</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPreferences({ roomScope: "entire-room" })}
            className={`rounded-xl border-2 px-3 py-3 text-center transition-all ${
              preferences.roomScope === "entire-room"
                ? "border-penny-500 bg-penny-50 shadow-sm"
                : "border-stone-200 hover:border-stone-300"
            }`}
          >
            <p className="text-sm font-semibold text-stone-700">Entire Room</p>
            <p className="mt-1 text-xs text-stone-400">Auto-suggest full setup</p>
          </button>

          <button
            onClick={() => setPreferences({ roomScope: "custom" })}
            className={`rounded-xl border-2 px-3 py-3 text-center transition-all ${
              preferences.roomScope === "custom"
                ? "border-penny-500 bg-penny-50 shadow-sm"
                : "border-stone-200 hover:border-stone-300"
            }`}
          >
            <p className="text-sm font-semibold text-stone-700">Custom Items</p>
            <p className="mt-1 text-xs text-stone-400">Pick only what you need</p>
          </button>
        </div>

        {preferences.roomScope === "custom" && (
          <div className="mt-4 space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-stone-400">
              What furniture do you want?
            </label>
            <textarea
              rows={3}
              value={preferences.requestedFurniture}
              onChange={(e) =>
                setPreferences({ requestedFurniture: e.target.value })
              }
              placeholder="Example: sofa, coffee table, floor lamp"
              className="w-full resize-none rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400 outline-none ring-penny-200 focus:ring-2"
            />
            <p className="text-xs text-stone-500">
              If an item is unavailable, we&apos;ll pick the closest category in our catalog.
            </p>
          </div>
        )}
      </div>

      {/* Style Selection */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="text-penny-500" size={20} />
          <h3 className="text-lg font-semibold text-stone-800">Style</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => setPreferences({ style: s.value })}
              className={`rounded-xl border-2 px-3 py-3 text-center transition-all ${
                preferences.style === s.value
                  ? "border-penny-500 bg-penny-50 shadow-sm"
                  : "border-stone-200 hover:border-stone-300"
              }`}
            >
              <span className="text-2xl">{s.emoji}</span>
              <p
                className={`mt-1 text-sm font-medium ${
                  preferences.style === s.value
                    ? "text-penny-700"
                    : "text-stone-600"
                }`}
              >
                {s.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="text-penny-500" size={20} />
          <h3 className="text-lg font-semibold text-stone-800">Prioritize</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { key: "price", label: "Lowest Price", icon: "💰" },
              { key: "rating", label: "Best Rated", icon: "⭐" },
              { key: "style", label: "Best Match", icon: "🎯" },
            ] as const
          ).map((p) => (
            <button
              key={p.key}
              onClick={() => setPreferences({ prioritize: p.key })}
              className={`rounded-xl border-2 px-3 py-3 text-center transition-all ${
                preferences.prioritize === p.key
                  ? "border-penny-500 bg-penny-50 shadow-sm"
                  : "border-stone-200 hover:border-stone-300"
              }`}
            >
              <span className="text-xl">{p.icon}</span>
              <p className="mt-1 text-xs font-medium text-stone-600">
                {p.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleSearch}
        className="mx-auto flex items-center gap-2 rounded-xl bg-penny-500 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-penny-500/25 transition-all hover:bg-penny-600 hover:shadow-xl"
      >
        Find Furniture
        <ArrowRight size={20} />
      </button>
    </div>
  );
}

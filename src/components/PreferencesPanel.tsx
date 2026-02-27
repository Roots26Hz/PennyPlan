"use client";

import { useStore } from "@/lib/store";
import type { StylePreference } from "@/lib/types";
import { DollarSign, Palette, Sparkles, ArrowRight } from "lucide-react";

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
  const { preferences, setPreferences, setStep, parseResult } = useStore();

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
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-400">
            Detected Room
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-stone-800">
                {parseResult.floorPlan.widthFt}&apos;
              </p>
              <p className="text-xs text-stone-400">Width</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800">
                {parseResult.floorPlan.lengthFt}&apos;
              </p>
              <p className="text-xs text-stone-400">Length</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800">
                {parseResult.floorPlan.heightFt}&apos;
              </p>
              <p className="text-xs text-stone-400">Height</p>
            </div>
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

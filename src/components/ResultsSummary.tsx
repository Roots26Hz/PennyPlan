"use client";

import { useStore } from "@/lib/store";
import {
  DollarSign,
  Package,
  PiggyBank,
  Sparkles,
  ExternalLink,
  Star,
  RotateCcw,
} from "lucide-react";

export default function ResultsSummary() {
  const { optimizationResult, preferences, parseResult, reset } = useStore();

  if (!optimizationResult || !parseResult) {
    return (
      <div className="py-20 text-center text-stone-400">
        No results yet. Please complete the previous steps.
      </div>
    );
  }

  const { totalCost, items, savings, fitScore, styleScore } =
    optimizationResult;
  const underBudget = preferences.budget - totalCost;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Hero Summary */}
      <div className="rounded-2xl bg-gradient-to-br from-penny-500 to-penny-700 p-8 text-white shadow-xl">
        <h2 className="text-3xl font-bold">Your PennyPlan is Ready!</h2>
        <p className="mt-2 text-penny-100">
          {parseResult.floorPlan.roomName} •{" "}
          {parseResult.floorPlan.widthFt}&apos; ×{" "}
          {parseResult.floorPlan.lengthFt}&apos; • {preferences.style} style
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white/15 p-4 backdrop-blur-sm">
            <DollarSign className="mb-1" size={20} />
            <p className="text-2xl font-bold">${totalCost.toFixed(0)}</p>
            <p className="text-xs text-penny-200">Total Cost</p>
          </div>
          <div className="rounded-xl bg-white/15 p-4 backdrop-blur-sm">
            <PiggyBank className="mb-1" size={20} />
            <p className="text-2xl font-bold">${underBudget.toFixed(0)}</p>
            <p className="text-xs text-penny-200">Under Budget</p>
          </div>
          <div className="rounded-xl bg-white/15 p-4 backdrop-blur-sm">
            <Package className="mb-1" size={20} />
            <p className="text-2xl font-bold">{items.length}</p>
            <p className="text-xs text-penny-200">Pieces</p>
          </div>
          <div className="rounded-xl bg-white/15 p-4 backdrop-blur-sm">
            <Sparkles className="mb-1" size={20} />
            <p className="text-2xl font-bold">{styleScore}%</p>
            <p className="text-xs text-penny-200">Style Match</p>
          </div>
        </div>
      </div>

      {/* Shopping List */}
      <div>
        <h3 className="mb-4 text-xl font-bold text-stone-800">
          Shopping List
        </h3>
        <div className="space-y-3">
          {items.map((placed, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-penny-100 text-penny-600 font-bold">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-stone-800">
                    {placed.item.name}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-stone-400">
                    <span>{placed.item.retailer}</span>
                    <span>•</span>
                    <span>
                      {placed.item.dimensions.widthIn}&quot;W ×{" "}
                      {placed.item.dimensions.depthIn}&quot;D ×{" "}
                      {placed.item.dimensions.heightIn}&quot;H
                    </span>
                    <span>•</span>
                    <div className="flex items-center gap-0.5">
                      <Star
                        size={12}
                        className="fill-amber-400 text-amber-400"
                      />
                      <span>{placed.item.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xl font-bold text-penny-600">
                  ${placed.item.price.toFixed(0)}
                </span>
                <a
                  href={placed.item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-penny-50 p-2 text-penny-500 transition-colors hover:bg-penny-100"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-stone-800 p-4 text-white">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-bold">
            ${totalCost.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Estimated Savings */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <div className="flex items-center gap-2">
          <PiggyBank className="text-green-600" size={20} />
          <h4 className="font-semibold text-green-800">
            Estimated Savings: ${savings}
          </h4>
        </div>
        <p className="mt-1 text-sm text-green-700">
          Compared to average retail prices, PennyPlan saved you an estimated $
          {savings} by prioritizing the cheapest options that fit your space and
          style.
        </p>
      </div>

      {/* Start Over */}
      <div className="text-center">
        <button
          onClick={reset}
          className="mx-auto flex items-center gap-2 rounded-xl border-2 border-stone-300 px-6 py-3 text-stone-600 transition-all hover:border-stone-400 hover:bg-stone-100"
        >
          <RotateCcw size={18} />
          Plan Another Room
        </button>
      </div>
    </div>
  );
}

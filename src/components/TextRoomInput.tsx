"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Type, Loader2, Sparkles, ArrowRight } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "A 12x14 foot living room with one door on the south wall and two windows on the north wall. I need a sofa, coffee table, bookshelf, and a floor lamp.",
  "Small 10x10 bedroom with a door on the left wall and a window on the far wall. Needs a full-size bed, nightstand, and a small dresser.",
  "15x12 home office with a door on the east wall and a large window on the west wall. Need a desk, office chair, and bookshelf.",
];

export default function TextRoomInput() {
  const {
    textDescription,
    setTextDescription,
    isParsingSketch,
    setIsParsingSketch,
    setParseResult,
    setStep,
  } = useStore();

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!textDescription.trim()) return;

    setIsParsingSketch(true);
    setError(null);

    try {
      const res = await fetch("/api/parse-sketch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textDescription }),
      });

      if (!res.ok) throw new Error("Failed to parse room description");

      const data = await res.json();
      setParseResult(data);
      setStep("preferences");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse description");
    } finally {
      setIsParsingSketch(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="relative">
        <textarea
          value={textDescription}
          onChange={(e) => setTextDescription(e.target.value)}
          placeholder="Describe your room: dimensions, doors, windows, and what furniture you need..."
          rows={5}
          className="w-full resize-none rounded-xl border-2 border-stone-200 bg-white p-4 text-stone-700 placeholder:text-stone-400 focus:border-penny-400 focus:outline-none focus:ring-2 focus:ring-penny-100"
        />
        <Type className="absolute right-3 top-3 text-stone-300" size={18} />
      </div>

      {/* Example prompts */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
          Try an example
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => setTextDescription(prompt)}
              className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-left text-xs text-stone-500 transition-colors hover:border-penny-300 hover:bg-penny-50"
            >
              {prompt.slice(0, 60)}...
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!textDescription.trim() || isParsingSketch}
        className="mx-auto flex items-center gap-2 rounded-xl bg-penny-500 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-penny-500/25 transition-all hover:bg-penny-600 hover:shadow-xl disabled:opacity-60"
      >
        {isParsingSketch ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Imagining Your Room...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Imagine My Room
          </>
        )}
      </button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";

export default function Navbar() {
  const { currentStep, reset } = useStore();

  const steps = [
    { key: "upload", label: "Upload Sketch" },
    { key: "preferences", label: "Preferences" },
    { key: "visualize", label: "3D View" },
    { key: "results", label: "Results" },
  ] as const;

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" onClick={reset}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-penny-500 text-white">
            <Home size={18} />
          </div>
          <span className="text-xl font-bold text-stone-800">
            Penny<span className="text-penny-500">Plan</span>
          </span>
        </Link>

        {/* Step Indicator */}
        <div className="hidden items-center gap-1 md:flex">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-center">
              <div
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  currentStep === step.key
                    ? "bg-penny-500 text-white"
                    : "text-stone-400"
                }`}
              >
                {step.label}
              </div>
              {i < steps.length - 1 && (
                <div className="mx-1 h-px w-6 bg-stone-300" />
              )}
            </div>
          ))}
        </div>

        {/* Reset */}
        <button
          onClick={reset}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
        >
          <RotateCcw size={14} />
          Start Over
        </button>
      </div>
    </nav>
  );
}

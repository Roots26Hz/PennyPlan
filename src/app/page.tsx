"use client";

import Navbar from "@/components/Navbar";
import SketchUploader from "@/components/SketchUploader";
import PreferencesPanel from "@/components/PreferencesPanel";
import VisualizePage from "@/components/VisualizePage";
import ResultsSummary from "@/components/ResultsSummary";
import { useStore } from "@/lib/store";
import { Upload, SlidersHorizontal, Box, ShoppingCart } from "lucide-react";

export default function Home() {
  const { currentStep } = useStore();

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero (only on upload step) */}
      {currentStep === "upload" && (
        <section className="border-b border-stone-200 bg-gradient-to-b from-white to-stone-50 px-6 py-16 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-5xl font-extrabold tracking-tight text-stone-900">
              Furnish Smart.{" "}
              <span className="text-penny-500">Spend Less.</span>
            </h1>
            <p className="mt-4 text-lg text-stone-500">
              Upload a hand-drawn room sketch, set your budget, and PennyPlan
              will find the cheapest real furniture that fits your space
              perfectly — visualized in 3D.
            </p>

            {/* How it works */}
            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                {
                  icon: Upload,
                  label: "Upload Sketch",
                  desc: "Snap a photo of your hand-drawn room layout",
                },
                {
                  icon: SlidersHorizontal,
                  label: "Set Budget",
                  desc: "Choose your budget and style preferences",
                },
                {
                  icon: Box,
                  label: "3D Preview",
                  desc: "See furniture placed in your actual room",
                },
                {
                  icon: ShoppingCart,
                  label: "Shop & Save",
                  desc: "Get a cheapest-first shopping list with links",
                },
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-penny-100 text-penny-500">
                    <step.icon size={22} />
                  </div>
                  <h3 className="text-sm font-semibold text-stone-700">
                    {step.label}
                  </h3>
                  <p className="mt-1 text-xs text-stone-400">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Step Content */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        {currentStep === "upload" && <SketchUploader />}
        {currentStep === "preferences" && <PreferencesPanel />}
        {currentStep === "visualize" && <VisualizePage />}
        {currentStep === "results" && <ResultsSummary />}
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white px-6 py-6 text-center text-sm text-stone-400">
        PennyPlan — Built for the AMD Slingshot Hackathon 2026. AI-powered budget home
        decor optimization.
      </footer>
    </main>
  );
}

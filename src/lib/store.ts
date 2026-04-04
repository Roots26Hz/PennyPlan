import { create } from "zustand";
import type {
  FloorPlan,
  FurnitureItem,
  DesignPreferences,
  PlacedFurniture,
  OptimizationResult,
  SketchParseResult,
  InputMode,
  FurnitureAlternatives,
} from "./types";

interface PennyPlanState {
  // Step tracking
  currentStep: "upload" | "preferences" | "visualize" | "results";
  setStep: (step: PennyPlanState["currentStep"]) => void;

  // Input mode
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;

  // Text description (for "text" mode)
  textDescription: string;
  setTextDescription: (text: string) => void;

  // Sketch & Floor Plan
  sketchFile: File | null;
  sketchPreview: string | null;
  parseResult: SketchParseResult | null;
  isParsingSketch: boolean;
  setSketchFile: (file: File, preview: string) => void;
  setSketchPreview: (preview: string) => void;
  setParseResult: (result: SketchParseResult) => void;
  setIsParsingSketch: (v: boolean) => void;

  // Preferences
  preferences: DesignPreferences;
  setPreferences: (prefs: Partial<DesignPreferences>) => void;

  // Furniture search results
  searchResults: FurnitureItem[];
  isSearching: boolean;
  setSearchResults: (items: FurnitureItem[]) => void;
  setIsSearching: (v: boolean) => void;

  // Optimization
  optimizationResult: OptimizationResult | null;
  isOptimizing: boolean;
  setOptimizationResult: (result: OptimizationResult | null) => void;
  setIsOptimizing: (v: boolean) => void;

  // Alternatives (two suggestions per category)
  alternatives: FurnitureAlternatives[];
  setAlternatives: (alts: FurnitureAlternatives[]) => void;
  swapAlternative: (category: string) => void;

  // Reset
  reset: () => void;
}

const defaultPreferences: DesignPreferences = {
  budget: 2000,
  style: "modern",
  colorPalette: ["#f5f5f4", "#78716c", "#ea580c"],
  prioritize: "price",
  roomScope: "entire-room",
  requestedFurniture: "",
};

export const useStore = create<PennyPlanState>((set) => ({
  currentStep: "upload",
  setStep: (step) => set({ currentStep: step }),

  inputMode: "upload",
  setInputMode: (mode) => set({ inputMode: mode }),

  textDescription: "",
  setTextDescription: (text) => set({ textDescription: text }),

  sketchFile: null,
  sketchPreview: null,
  parseResult: null,
  isParsingSketch: false,
  setSketchFile: (file, preview) => set({ sketchFile: file, sketchPreview: preview }),
  setSketchPreview: (preview) => set({ sketchPreview: preview }),
  setParseResult: (result) => set({ parseResult: result }),
  setIsParsingSketch: (v) => set({ isParsingSketch: v }),

  preferences: defaultPreferences,
  setPreferences: (prefs) =>
    set((state) => ({
      preferences: { ...state.preferences, ...prefs },
    })),

  searchResults: [],
  isSearching: false,
  setSearchResults: (items) => set({ searchResults: items }),
  setIsSearching: (v) => set({ isSearching: v }),

  optimizationResult: null,
  isOptimizing: false,
  setOptimizationResult: (result) => set({ optimizationResult: result }),
  setIsOptimizing: (v) => set({ isOptimizing: v }),

  alternatives: [],
  setAlternatives: (alts) => set({ alternatives: alts }),
  swapAlternative: (category) =>
    set((state) => ({
      alternatives: state.alternatives.map((alt) =>
        alt.category === category
          ? { ...alt, selectedIndex: alt.selectedIndex === 0 ? 1 : 0 }
          : alt
      ),
    })),

  reset: () =>
    set({
      currentStep: "upload",
      inputMode: "upload",
      textDescription: "",
      sketchFile: null,
      sketchPreview: null,
      parseResult: null,
      isParsingSketch: false,
      preferences: defaultPreferences,
      searchResults: [],
      isSearching: false,
      optimizationResult: null,
      isOptimizing: false,
      alternatives: [],
    }),
}));

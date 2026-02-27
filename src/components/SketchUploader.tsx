"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileImage,
  Loader2,
  CheckCircle2,
  Pencil,
  Type,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { InputMode } from "@/lib/types";
import DrawingCanvas from "./DrawingCanvas";
import TextRoomInput from "./TextRoomInput";

const TABS: { key: InputMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: "upload", label: "Upload Photo", icon: <Upload size={18} />, desc: "Snap a photo of your hand-drawn sketch" },
  { key: "draw", label: "Draw Here", icon: <Pencil size={18} />, desc: "Sketch your room layout right in the browser" },
  { key: "text", label: "Imagine with Text", icon: <Type size={18} />, desc: "Describe your room and let AI build the layout" },
];

export default function SketchUploader() {
  const {
    sketchPreview,
    setSketchFile,
    setSketchPreview,
    isParsingSketch,
    setIsParsingSketch,
    setParseResult,
    setStep,
    inputMode,
    setInputMode,
  } = useStore();

  const [error, setError] = useState<string | null>(null);

  // --- Upload mode ---
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setError(null);
      const reader = new FileReader();
      reader.onload = () => {
        setSketchFile(file, reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [setSketchFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  // --- Parse handler (upload + draw modes share this) ---
  const handleParseSketch = async () => {
    if (!sketchPreview) return;

    setIsParsingSketch(true);
    setError(null);

    try {
      const res = await fetch("/api/parse-sketch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: sketchPreview }),
      });

      if (!res.ok) throw new Error("Failed to parse sketch");

      const data = await res.json();
      setParseResult(data);
      setStep("preferences");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse sketch");
    } finally {
      setIsParsingSketch(false);
    }
  };

  // --- Drawing complete handler ---
  const handleDrawingComplete = (dataUrl: string) => {
    setSketchPreview(dataUrl);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-stone-800">
          Describe Your Room
        </h2>
        <p className="mt-2 text-stone-500">
          Upload a photo, draw it here, or just describe it in words.
        </p>
      </div>

      {/* Tab Selector */}
      <div className="mb-6 flex rounded-xl border border-stone-200 bg-stone-50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setInputMode(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              inputMode === tab.key
                ? "bg-white text-penny-600 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <p className="mb-4 text-center text-xs text-stone-400">
        {TABS.find((t) => t.key === inputMode)?.desc}
      </p>

      {/* ==================== UPLOAD MODE ==================== */}
      {inputMode === "upload" && (
        <>
          <div
            {...getRootProps()}
            className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
              isDragActive
                ? "border-penny-400 bg-penny-50"
                : sketchPreview
                ? "border-green-300 bg-green-50/50"
                : "border-stone-300 bg-white hover:border-penny-300 hover:bg-penny-50/30"
            }`}
          >
            <input {...getInputProps()} />

            {sketchPreview ? (
              <div className="space-y-4">
                <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
                <img
                  src={sketchPreview}
                  alt="Sketch preview"
                  className="mx-auto max-h-64 rounded-lg shadow-md"
                />
                <p className="text-sm text-stone-500">
                  Click or drag to replace the sketch
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-penny-100 text-penny-500 transition-transform group-hover:scale-110">
                  {isDragActive ? <FileImage size={28} /> : <Upload size={28} />}
                </div>
                <div>
                  <p className="text-lg font-medium text-stone-700">
                    {isDragActive
                      ? "Drop your sketch here..."
                      : "Drag & drop your room sketch"}
                  </p>
                  <p className="mt-1 text-sm text-stone-400">
                    PNG, JPG, or WEBP up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {sketchPreview && (
            <button
              onClick={handleParseSketch}
              disabled={isParsingSketch}
              className="mx-auto mt-6 flex items-center gap-2 rounded-xl bg-penny-500 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-penny-500/25 transition-all hover:bg-penny-600 hover:shadow-xl disabled:opacity-60"
            >
              {isParsingSketch ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing Sketch...
                </>
              ) : (
                <>
                  <FileImage size={20} />
                  Analyze My Room
                </>
              )}
            </button>
          )}
        </>
      )}

      {/* ==================== DRAW MODE ==================== */}
      {inputMode === "draw" && (
        <>
          <DrawingCanvas onDrawingComplete={handleDrawingComplete} />

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleParseSketch}
            disabled={isParsingSketch || !sketchPreview}
            className="mx-auto mt-6 flex items-center gap-2 rounded-xl bg-penny-500 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-penny-500/25 transition-all hover:bg-penny-600 hover:shadow-xl disabled:opacity-60"
          >
            {isParsingSketch ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Analyzing Drawing...
              </>
            ) : (
              <>
                <Pencil size={20} />
                Analyze My Drawing
              </>
            )}
          </button>
        </>
      )}

      {/* ==================== TEXT MODE ==================== */}
      {inputMode === "text" && <TextRoomInput />}
    </div>
  );
}

"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Eraser, Pencil, Undo2, Trash2, Square, Circle, DoorOpen } from "lucide-react";

interface DrawingCanvasProps {
  onDrawingComplete: (dataUrl: string) => void;
}

type Tool = "pencil" | "eraser" | "rect" | "door";

export default function DrawingCanvas({ onDrawingComplete }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>("pencil");
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null);

  // Initialize canvas with white background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 450;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw faint grid
    ctx.strokeStyle = "#e5e5e5";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Label hints
    ctx.fillStyle = "#d4d4d4";
    ctx.font = "14px Inter, sans-serif";
    ctx.fillText("Draw your room walls, doors (🚪) & windows here", 130, 225);

    saveSnapshot();
  }, []);

  const saveSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-20), snap]);
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);

    if (tool === "rect" || tool === "door") {
      setRectStart(pos);
      saveSnapshot();
      setIsDrawing(true);
      return;
    }

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : "#1c1917";
    ctx.lineWidth = tool === "eraser" ? lineWidth * 4 : lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);

    if ((tool === "rect" || tool === "door") && rectStart) {
      // Restore last snapshot and draw preview
      if (history.length > 0) {
        ctx.putImageData(history[history.length - 1], 0, 0);
      }
      const w = pos.x - rectStart.x;
      const h = pos.y - rectStart.y;

      if (tool === "door") {
        // Draw door as arc + line
        ctx.strokeStyle = "#b45309";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(rectStart.x, rectStart.y, w, h);
        ctx.setLineDash([]);
        // Door arc indicator
        ctx.beginPath();
        ctx.arc(rectStart.x, rectStart.y + h, Math.abs(w) * 0.4, -Math.PI / 2, 0);
        ctx.stroke();
        // Label
        ctx.fillStyle = "#b45309";
        ctx.font = "11px Inter, sans-serif";
        ctx.fillText("🚪 Door", rectStart.x + 4, rectStart.y + h / 2);
      } else {
        ctx.strokeStyle = "#1c1917";
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(rectStart.x, rectStart.y, w, h);
      }
      return;
    }

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setRectStart(null);
    saveSnapshot();
    emitDrawing();
  };

  const emitDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onDrawingComplete(canvas.toDataURL("image/png"));
  }, [onDrawingComplete]);

  const undo = () => {
    if (history.length < 2) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newHistory = history.slice(0, -1);
    ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
    setHistory(newHistory);
    emitDrawing();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw grid
    ctx.strokeStyle = "#e5e5e5";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    saveSnapshot();
    emitDrawing();
  };

  const tools: { key: Tool; icon: React.ReactNode; label: string }[] = [
    { key: "pencil", icon: <Pencil size={16} />, label: "Draw" },
    { key: "rect", icon: <Square size={16} />, label: "Wall" },
    { key: "door", icon: <DoorOpen size={16} />, label: "Door" },
    { key: "eraser", icon: <Eraser size={16} />, label: "Eraser" },
  ];

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        {tools.map((t) => (
          <button
            key={t.key}
            onClick={() => setTool(t.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tool === t.key
                ? "bg-penny-500 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}

        <div className="mx-2 h-6 w-px bg-stone-200" />

        {/* Line width */}
        <input
          type="range"
          min={1}
          max={8}
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className="w-20 accent-penny-500"
          title="Brush size"
        />

        <div className="flex-1" />

        <button
          onClick={undo}
          className="rounded-lg bg-stone-100 p-2 text-stone-500 hover:bg-stone-200"
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={clearCanvas}
          className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100"
          title="Clear"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        className="w-full cursor-crosshair rounded-xl border-2 border-stone-200 bg-white shadow-inner"
        style={{ aspectRatio: "4/3" }}
      />

      <p className="text-center text-xs text-stone-400">
        Draw walls as rectangles • Use the Door tool for doorways • Add
        measurements as text annotations
      </p>
    </div>
  );
}

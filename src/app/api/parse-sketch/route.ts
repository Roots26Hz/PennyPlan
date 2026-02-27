import { NextRequest, NextResponse } from "next/server";
import { parseSketchImage } from "@/lib/ai/sketchParser";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, text } = body;

    if (!image && !text) {
      return NextResponse.json(
        { error: "No image or text description provided" },
        { status: 400 }
      );
    }

    const result = await parseSketchImage(image || undefined, text || undefined);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Sketch parsing error:", error);
    return NextResponse.json(
      { error: "Failed to parse sketch" },
      { status: 500 }
    );
  }
}

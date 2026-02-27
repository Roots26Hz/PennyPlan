import OpenAI from "openai";
import type { SketchParseResult, FloorPlan, FurnitureCategory } from "../types";

/**
 * Uses GitHub Models API (GPT-4o) to parse a hand-drawn room sketch
 * into structured JSON floorplan data.
 */
function getClient(): OpenAI {
  return new OpenAI({
    baseURL: "https://models.inference.ai.azure.com",
    apiKey: process.env.GITHUB_TOKEN || "",
  });
}

const SYSTEM_PROMPT = `You are a spatial-analysis AI for the PennyPlan app. 
Your job is to analyze a room input (either a hand-drawn sketch image OR a text description) and extract:

1. Room dimensions (width, length, height in feet) — estimate from the sketch proportions, written annotations, or text description.
2. Wall positions as line segments.
3. **DOORS and WINDOWS (openings)** — Pay VERY close attention to doorways. Detect:
   - Door positions, which wall they're on, and their swing direction.
   - Ensure NO furniture is placed in front of or blocking any door's swing path.
   - Window positions along walls.
4. Any obstacles (columns, radiators, fireplaces).
5. Suggested furniture categories that would fit this room type (e.g., living room → sofa, table, lamp; bedroom → bed, nightstand, dresser).

IMPORTANT RULES:
- If the sketch has written measurements, use them. If not, estimate reasonable dimensions.
- ALWAYS include at least one door in your output. Every real room has a door.
- Mark door swing clearance: the "positionAlongWall" + "widthFt" indicates the zone to keep clear.
- For text descriptions, extract the exact dimensions and room details mentioned.

Respond ONLY with valid JSON matching this schema:
{
  "floorPlan": {
    "roomName": "string (e.g. 'Living Room')",
    "widthFt": number,
    "lengthFt": number,
    "heightFt": number,
    "walls": [{ "id": "string", "startX": number, "startY": number, "endX": number, "endY": number, "lengthFt": number }],
    "obstacles": [{ "id": "string", "type": "column|radiator|fireplace|other", "x": number, "y": number, "widthFt": number, "depthFt": number }],
    "openings": [{ "id": "string", "type": "door|window", "wallId": "string", "positionAlongWall": number, "widthFt": number, "heightFt": number }]
  },
  "suggestedCategories": ["sofa", "table", ...],
  "confidence": number (0-1)
}`;

export async function parseSketchImage(
  base64Image?: string,
  textDescription?: string
): Promise<SketchParseResult> {
  // Build user message based on input type
  const userContent: any[] = [];

  if (textDescription) {
    userContent.push({
      type: "text",
      text: `Parse this room description into a floorplan JSON. Pay special attention to door and window positions:\n\n"${textDescription}"`,
    });
  }

  if (base64Image) {
    userContent.push({
      type: "text",
      text: "Analyze this hand-drawn room sketch. Pay special attention to any doorways, door symbols (arcs), and windows. Extract the floorplan data as JSON.",
    });
    userContent.push({
      type: "image_url",
      image_url: {
        url: base64Image,
        detail: "high",
      },
    });
  }

  if (userContent.length === 0) {
    throw new Error("No image or text provided");
  }

  const response = await getClient().chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.1,
    max_tokens: 2000,
  });

  const rawResponse = response.choices[0]?.message?.content || "";

  // Extract JSON from the response (handle markdown code blocks)
  let jsonStr = rawResponse;
  const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      floorPlan: parsed.floorPlan,
      suggestedCategories: parsed.suggestedCategories,
      confidence: parsed.confidence,
      rawResponse,
    };
  } catch {
    // Fallback: return a default room if parsing fails
    return {
      floorPlan: {
        roomName: "Room",
        widthFt: 12,
        lengthFt: 14,
        heightFt: 9,
        walls: [
          { id: "w1", startX: 0, startY: 0, endX: 12, endY: 0, lengthFt: 12 },
          { id: "w2", startX: 12, startY: 0, endX: 12, endY: 14, lengthFt: 14 },
          { id: "w3", startX: 12, startY: 14, endX: 0, endY: 14, lengthFt: 12 },
          { id: "w4", startX: 0, startY: 14, endX: 0, endY: 0, lengthFt: 14 },
        ],
        obstacles: [],
        openings: [
          { id: "d1", type: "door", wallId: "w1", positionAlongWall: 0.3, widthFt: 3, heightFt: 7 },
          { id: "win1", type: "window", wallId: "w3", positionAlongWall: 0.5, widthFt: 4, heightFt: 4 },
        ],
      },
      suggestedCategories: ["sofa", "table", "lamp", "rug", "bookshelf"],
      confidence: 0.3,
      rawResponse,
    };
  }
}

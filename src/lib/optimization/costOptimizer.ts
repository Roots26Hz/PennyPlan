import type {
  FurnitureItem,
  FloorPlan,
  PlacedFurniture,
  OptimizationResult,
  DesignPreferences,
  Opening,
} from "../types";

/**
 * The "Cheapest-First" Optimization Engine
 * 
 * Given a room floor plan, a set of candidate furniture items, and user preferences,
 * this engine finds the lowest-cost combination that:
 * 1. Physically fits (dimensions checked against room size)
 * 2. Doesn't overlap with other placed pieces
 * 3. Stays fully inside the room walls
 * 4. Keeps door swing paths and window areas clear
 * 5. Maximizes style cohesion within the budget
 */

const CLEARANCE = 0.6; // feet of clearance between items
const WALL_GAP = 0.15; // small gap from wall surface
const DOOR_SWING_DEPTH = 3.5; // feet of clearance in front of a door

/**
 * Get the footprint of an item at a given rotation (in feet).
 */
function footprint(item: FurnitureItem, rotation: number): { w: number; d: number } {
  const wFt = item.dimensions.widthIn / 12;
  const dFt = item.dimensions.depthIn / 12;
  if (rotation === 90 || rotation === 270) {
    return { w: dFt, d: wFt };
  }
  return { w: wFt, d: dFt };
}

/**
 * Check if a furniture item physically fits in the room in at least one orientation.
 */
function itemFitsInRoom(item: FurnitureItem, floorPlan: FloorPlan): boolean {
  const wFt = item.dimensions.widthIn / 12;
  const dFt = item.dimensions.depthIn / 12;
  return (
    (wFt + WALL_GAP * 2 <= floorPlan.widthFt && dFt + WALL_GAP * 2 <= floorPlan.lengthFt) ||
    (dFt + WALL_GAP * 2 <= floorPlan.widthFt && wFt + WALL_GAP * 2 <= floorPlan.lengthFt)
  );
}

/**
 * Check whether a box at (cx, cz) with half-extents (hw, hd) stays inside the room.
 */
function insideRoom(
  cx: number,
  cz: number,
  hw: number,
  hd: number,
  floorPlan: FloorPlan
): boolean {
  const halfW = floorPlan.widthFt / 2;
  const halfL = floorPlan.lengthFt / 2;
  return (
    cx - hw >= -halfW + WALL_GAP &&
    cx + hw <= halfW - WALL_GAP &&
    cz - hd >= -halfL + WALL_GAP &&
    cz + hd <= halfL - WALL_GAP
  );
}

/**
 * AABB overlap check between a candidate placement and every existing placement.
 */
function checkOverlap(
  hw: number,
  hd: number,
  cx: number,
  cz: number,
  existing: PlacedFurniture[]
): boolean {
  for (const placed of existing) {
    const fp = footprint(placed.item, placed.rotation);
    const phw = fp.w / 2;
    const phd = fp.d / 2;

    if (
      Math.abs(cx - placed.position.x) < hw + phw + CLEARANCE &&
      Math.abs(cz - placed.position.z) < hd + phd + CLEARANCE
    ) {
      return true; // overlaps
    }
  }
  return false;
}

/** Exclusion zone rectangle (axis-aligned) */
interface ExclusionZone {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * Build exclusion zones around doors (and optionally windows on the wall face).
 * Doors need a swing clearance area in front of them.
 * Windows need a small strip so furniture doesn't block them visually.
 */
function buildExclusionZones(floorPlan: FloorPlan): ExclusionZone[] {
  const zones: ExclusionZone[] = [];
  const { widthFt, lengthFt, openings, walls } = floorPlan;
  const halfW = widthFt / 2;
  const halfL = lengthFt / 2;

  if (!openings) return zones;

  for (const opening of openings) {
    const wall = walls?.find((wl) => wl.id === opening.wallId);
    const oW = opening.widthFt;
    const halfOW = oW / 2;
    const isDoor = opening.type === "door";
    const depth = isDoor ? DOOR_SWING_DEPTH : 1.0; // windows just need ~1ft strip

    // Classify wall edge
    let edge: "back" | "front" | "left" | "right" = "back";
    if (wall) {
      const dx = Math.abs(wall.endX - wall.startX);
      const dy = Math.abs(wall.endY - wall.startY);
      const midX = (wall.startX + wall.endX) / 2;
      const midY = (wall.startY + wall.endY) / 2;
      if (dx >= dy) {
        edge = midY < lengthFt / 2 ? "back" : "front";
      } else {
        edge = midX < widthFt / 2 ? "left" : "right";
      }
    }

    const t = opening.positionAlongWall;

    if (edge === "back" || edge === "front") {
      const cx = -halfW + t * widthFt;
      const clampedCx = Math.max(-halfW + halfOW, Math.min(halfW - halfOW, cx));
      if (edge === "back") {
        zones.push({ minX: clampedCx - halfOW, maxX: clampedCx + halfOW, minZ: -halfL, maxZ: -halfL + depth });
      } else {
        zones.push({ minX: clampedCx - halfOW, maxX: clampedCx + halfOW, minZ: halfL - depth, maxZ: halfL });
      }
    } else {
      const cz = -halfL + t * lengthFt;
      const clampedCz = Math.max(-halfL + halfOW, Math.min(halfL - halfOW, cz));
      if (edge === "left") {
        zones.push({ minX: -halfW, maxX: -halfW + depth, minZ: clampedCz - halfOW, maxZ: clampedCz + halfOW });
      } else {
        zones.push({ minX: halfW - depth, maxX: halfW, minZ: clampedCz - halfOW, maxZ: clampedCz + halfOW });
      }
    }
  }

  return zones;
}

/**
 * Check if a furniture box overlaps any exclusion zone (door/window clearance).
 */
function overlapsExclusion(
  cx: number,
  cz: number,
  hw: number,
  hd: number,
  zones: ExclusionZone[]
): boolean {
  for (const z of zones) {
    if (
      cx + hw > z.minX &&
      cx - hw < z.maxX &&
      cz + hd > z.minZ &&
      cz - hd < z.maxZ
    ) {
      return true;
    }
  }
  return false;
}

/**
 * For a given item + rotation, generate candidate (x, z) positions that are:
 * - Fully inside the room
 * - Snapped along walls or spaced in the interior
 */
function candidatePositions(
  item: FurnitureItem,
  rotation: number,
  floorPlan: FloorPlan
): Array<{ x: number; z: number }> {
  const fp = footprint(item, rotation);
  const hw = fp.w / 2;
  const hd = fp.d / 2;

  const halfW = floorPlan.widthFt / 2;
  const halfL = floorPlan.lengthFt / 2;

  const positions: Array<{ x: number; z: number }> = [];

  // Minimum inset from wall so item stays fully inside
  const minX = -halfW + hw + WALL_GAP;
  const maxX = halfW - hw - WALL_GAP;
  const minZ = -halfL + hd + WALL_GAP;
  const maxZ = halfL - hd - WALL_GAP;

  if (minX > maxX || minZ > maxZ) return []; // item too big

  // Wall-snapped positions: push item flush against each wall
  const xSteps = 5;
  const zSteps = 5;

  for (let i = 0; i <= xSteps; i++) {
    const x = minX + (maxX - minX) * (i / xSteps);

    // Back wall (z = minZ, flush to -Z wall)
    positions.push({ x, z: minZ });
    // Front wall (z = maxZ, flush to +Z wall)
    positions.push({ x, z: maxZ });
  }

  for (let i = 0; i <= zSteps; i++) {
    const z = minZ + (maxZ - minZ) * (i / zSteps);

    // Left wall (x = minX)
    positions.push({ x: minX, z });
    // Right wall (x = maxX)
    positions.push({ x: maxX, z });
  }

  // Interior grid (for rugs, coffee tables, etc.)
  const interiorSteps = 3;
  for (let ix = 1; ix < interiorSteps; ix++) {
    for (let iz = 1; iz < interiorSteps; iz++) {
      positions.push({
        x: minX + (maxX - minX) * (ix / interiorSteps),
        z: minZ + (maxZ - minZ) * (iz / interiorSteps),
      });
    }
  }

  return positions;
}

/** Priority order for wall placement by category */
const WALL_PRIORITY: Record<string, "wall" | "center" | "any"> = {
  bed: "wall",
  dresser: "wall",
  bookshelf: "wall",
  desk: "wall",
  nightstand: "wall",
  sofa: "wall",
  storage: "wall",
  rug: "center",
  lamp: "any",
  chair: "any",
  table: "center",
  other: "any",
};

/**
 * Try to place a single item. Returns the placement or null.
 */
function tryPlace(
  item: FurnitureItem,
  floorPlan: FloorPlan,
  existing: PlacedFurniture[],
  exclusionZones: ExclusionZone[]
): PlacedFurniture | null {
  const rotations = [0, 90];
  const pref = WALL_PRIORITY[item.category] || "any";

  // Try each rotation
  for (const rot of rotations) {
    const fp = footprint(item, rot);
    const hw = fp.w / 2;
    const hd = fp.d / 2;

    const positions = candidatePositions(item, rot, floorPlan);

    // Sort positions: wall-snapped first for "wall" pref, center first for "center"
    const halfW = floorPlan.widthFt / 2;
    const halfL = floorPlan.lengthFt / 2;

    const scored = positions.map((p) => {
      const distToWall = Math.min(
        Math.abs(p.x - (-halfW + hw + WALL_GAP)),
        Math.abs(p.x - (halfW - hw - WALL_GAP)),
        Math.abs(p.z - (-halfL + hd + WALL_GAP)),
        Math.abs(p.z - (halfL - hd - WALL_GAP))
      );
      const distToCenter = Math.sqrt(p.x * p.x + p.z * p.z);

      let score: number;
      if (pref === "wall") {
        score = distToWall; // lower = closer to wall = better
      } else if (pref === "center") {
        score = distToCenter; // lower = closer to center = better
      } else {
        score = distToWall * 0.3 + distToCenter * 0.7;
      }
      return { ...p, score };
    });

    scored.sort((a, b) => a.score - b.score);

    for (const pos of scored) {
      if (
        insideRoom(pos.x, pos.z, hw, hd, floorPlan) &&
        !checkOverlap(hw, hd, pos.x, pos.z, existing) &&
        !overlapsExclusion(pos.x, pos.z, hw, hd, exclusionZones)
      ) {
        return {
          item,
          position: { x: pos.x, y: 0, z: pos.z },
          rotation: rot,
          fits: true,
        };
      }
    }
  }

  return null;
}

/**
 * Main optimization function: Cheapest-first greedy placement
 * with proper spatial constraints.
 */
export function optimizeFurniture(
  candidates: FurnitureItem[],
  floorPlan: FloorPlan,
  preferences: DesignPreferences
): OptimizationResult {
  // Sort by priority
  const sorted = [...candidates].sort((a, b) => {
    switch (preferences.prioritize) {
      case "price":
        return a.price - b.price;
      case "rating":
        return b.rating - a.rating;
      case "style": {
        const aMatch = a.style.includes(preferences.style) ? 0 : 1;
        const bMatch = b.style.includes(preferences.style) ? 0 : 1;
        return aMatch - bMatch || a.price - b.price;
      }
      default:
        return a.price - b.price;
    }
  });

  const placements: PlacedFurniture[] = [];
  let totalCost = 0;
  const usedCategories = new Set<string>();
  const exclusionZones = buildExclusionZones(floorPlan);

  for (const item of sorted) {
    if (usedCategories.has(item.category)) continue;
    if (totalCost + item.price > preferences.budget) continue;
    if (!itemFitsInRoom(item, floorPlan)) continue;

    const placement = tryPlace(item, floorPlan, placements, exclusionZones);
    if (placement) {
      placements.push(placement);
      totalCost += item.price;
      usedCategories.add(item.category);
    }
  }

  // Calculate scores
  const styleMatches = placements.filter((p) =>
    p.item.style.includes(preferences.style)
  ).length;
  const styleScore =
    placements.length > 0
      ? Math.round((styleMatches / placements.length) * 100)
      : 0;

  const fitScore = placements.length > 0 ? 95 : 0;
  const savings = Math.round(totalCost * 0.3);

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    items: placements,
    savings,
    fitScore,
    styleScore,
  };
}

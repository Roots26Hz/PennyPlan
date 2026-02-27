"use client";

import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  PerspectiveCamera,
  Text,
} from "@react-three/drei";
import * as THREE from "three";
import type { FloorPlan, PlacedFurniture, FurnitureCategory } from "@/lib/types";
import { CATEGORY_COLORS, CATEGORY_COLORS_BORDER } from "@/lib/types";

interface RoomViewer3DProps {
  floorPlan: FloorPlan;
  placedFurniture: PlacedFurniture[];
  /** Optional: category currently being hovered in the alternatives panel */
  highlightCategory?: FurnitureCategory | null;
}

/** Renders the room walls, floor, openings, and door indicators */
function Room({ floorPlan }: { floorPlan: FloorPlan }) {
  const { widthFt, lengthFt, heightFt, openings, walls } = floorPlan;
  const w = widthFt;
  const l = lengthFt;
  const h = heightFt;

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[w, l]} />
        <meshStandardMaterial color="#f5f0eb" />
      </mesh>

      {/* Walls */}
      <mesh position={[0, h / 2, -l / 2]} receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#fafaf9" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[l, h]} />
        <meshStandardMaterial color="#f5f5f4" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[l, h]} />
        <meshStandardMaterial color="#f5f5f4" side={THREE.DoubleSide} />
      </mesh>

      {/* Wall outlines */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(w, h, l)]} />
        <lineBasicMaterial color="#d6d3d1" />
      </lineSegments>

      {/* Render door / window openings */}
      {openings?.map((opening) => {
        const wall = walls?.find((wl) => wl.id === opening.wallId);
        const doorW = opening.widthFt;
        const doorH = opening.heightFt || 6.8;
        const isDoor = opening.type === "door";
        const halfDoorW = doorW / 2;

        // Windows sit on a sill (~3ft up), doors start at floor level
        const WINDOW_SILL_HEIGHT = 3;
        const yCenter = isDoor
          ? doorH / 2                                 // door base at floor
          : WINDOW_SILL_HEIGHT + doorH / 2;           // window sill raised

        // Determine which room edge this opening is on & compute position
        let pos: [number, number, number] = [0, yCenter, -l / 2 + 0.05];
        let rot: [number, number, number] = [0, 0, 0];

        // Classify wall → one of 4 room edges
        type Edge = "back" | "front" | "left" | "right";
        let edge: Edge = "back";

        if (wall) {
          const dx = Math.abs(wall.endX - wall.startX);
          const dy = Math.abs(wall.endY - wall.startY);
          const midX = (wall.startX + wall.endX) / 2;
          const midY = (wall.startY + wall.endY) / 2;

          if (dx >= dy) {
            edge = midY < l / 2 ? "back" : "front";
          } else {
            edge = midX < w / 2 ? "left" : "right";
          }
        }

        // Map positionAlongWall (0→1) directly to room-centered coords
        // and clamp so the door panel stays fully inside the walls.
        const t = opening.positionAlongWall; // 0-1

        if (edge === "back" || edge === "front") {
          const raw = -w / 2 + t * w;
          const clamped = Math.max(-w / 2 + halfDoorW + 0.1, Math.min(w / 2 - halfDoorW - 0.1, raw));
          const zVal = edge === "back" ? -l / 2 + 0.05 : l / 2 - 0.05;
          pos = [clamped, yCenter, zVal];
          rot = [0, 0, 0];
        } else {
          const raw = -l / 2 + t * l;
          const clamped = Math.max(-l / 2 + halfDoorW + 0.1, Math.min(l / 2 - halfDoorW - 0.1, raw));
          const xVal = edge === "left" ? -w / 2 + 0.05 : w / 2 - 0.05;
          pos = [xVal, yCenter, clamped];
          rot = [0, Math.PI / 2, 0];
        }

        return (
          <group key={opening.id} position={pos} rotation={rot}>
            {/* Opening cut-out indicator */}
            <mesh>
              <planeGeometry args={[doorW, doorH]} />
              <meshStandardMaterial
                color={isDoor ? "#92400e" : "#7dd3fc"}
                transparent
                opacity={0.35}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Door frame outline */}
            <lineSegments>
              <edgesGeometry args={[new THREE.PlaneGeometry(doorW, doorH)]} />
              <lineBasicMaterial color={isDoor ? "#78350f" : "#0284c7"} linewidth={2} />
            </lineSegments>
            {/* Label */}
            <Text
              position={[0, doorH / 2 + 0.2, 0]}
              fontSize={0.2}
              color={isDoor ? "#78350f" : "#0284c7"}
              anchorX="center"
              anchorY="bottom"
            >
              {isDoor ? "DOOR" : "WINDOW"}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

/** A proxy box representing a furniture piece, color-coded by category */
function FurnitureProxy({
  placed,
  highlight,
}: {
  placed: PlacedFurniture;
  highlight: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const { item, position, rotation } = placed;

  const w = item.dimensions.widthIn / 12;
  const d = item.dimensions.depthIn / 12;
  const h = item.dimensions.heightIn / 12;

  // Color-code by category
  const fillColor = placed.fits
    ? (CATEGORY_COLORS[item.category] || "#78716c")
    : "#ef4444";
  const borderColor = placed.fits
    ? (CATEGORY_COLORS_BORDER[item.category] || "#57534e")
    : "#b91c1c";

  return (
    <group position={[position.x, h / 2, position.z]} rotation={[0, (rotation * Math.PI) / 180, 0]}>
      <mesh ref={ref} castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={fillColor}
          transparent
          opacity={highlight ? 0.9 : 0.7}
          roughness={0.3}
          emissive={highlight ? fillColor : "#000000"}
          emissiveIntensity={highlight ? 0.3 : 0}
        />
      </mesh>
      {/* Wireframe overlay */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
        <lineBasicMaterial color={borderColor} />
      </lineSegments>
      {/* Label */}
      <Text
        position={[0, h / 2 + 0.3, 0]}
        fontSize={0.25}
        color="#44403c"
        anchorX="center"
        anchorY="bottom"
      >
        {item.name || item.category}
      </Text>
    </group>
  );
}

export default function RoomViewer3D({
  floorPlan,
  placedFurniture,
  highlightCategory,
}: RoomViewer3DProps) {
  const cameraDistance = Math.max(floorPlan.widthFt, floorPlan.lengthFt) * 1.2;

  // Derive unique categories for color legend
  const uniqueCategories = Array.from(
    new Set(placedFurniture.map((pf) => pf.item.category))
  );

  return (
    <div>
      <div className="room-canvas h-[500px] w-full rounded-2xl border border-stone-200 bg-stone-100">
        <Canvas shadows>
          <PerspectiveCamera
            makeDefault
            position={[cameraDistance * 0.6, cameraDistance * 0.5, cameraDistance * 0.6]}
            fov={50}
          />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={3}
            maxDistance={cameraDistance * 2}
          />

          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 15, 10]}
            intensity={1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />

          <Grid
            args={[50, 50]}
            position={[0, -0.01, 0]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#e7e5e4"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#d6d3d1"
            fadeDistance={30}
            infiniteGrid
          />

          <Room floorPlan={floorPlan} />

          {placedFurniture.map((pf, i) => (
            <FurnitureProxy
              key={i}
              placed={pf}
              highlight={highlightCategory === pf.item.category}
            />
          ))}
        </Canvas>
      </div>

      {/* Color Legend */}
      {uniqueCategories.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          {uniqueCategories.map((cat) => (
            <div key={cat} className="flex items-center gap-1.5 text-xs text-stone-600">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: CATEGORY_COLORS[cat] }}
              />
              <span className="capitalize">{cat}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <span className="inline-block h-3 w-3 rounded-sm border border-stone-300" style={{ backgroundColor: "#92400e" }} />
            <span>Door</span>
          </div>
        </div>
      )}
    </div>
  );
}

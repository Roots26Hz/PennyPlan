"use client";

import Image from "next/image";
import { Star, ExternalLink, Ruler, Check, X } from "lucide-react";
import type { FurnitureItem } from "@/lib/types";

interface FurnitureCardProps {
  item: FurnitureItem;
  fits: boolean;
  onSelect?: (item: FurnitureItem) => void;
  selected?: boolean;
}

export default function FurnitureCard({
  item,
  fits,
  onSelect,
  selected,
}: FurnitureCardProps) {
  return (
    <div
      onClick={() => onSelect?.(item)}
      className={`group cursor-pointer overflow-hidden rounded-xl border-2 bg-white transition-all hover:shadow-lg ${
        selected
          ? "border-penny-500 shadow-md"
          : fits
          ? "border-stone-200 hover:border-penny-300"
          : "border-red-200 opacity-60"
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-stone-300">
            🪑
          </div>
        )}
        {/* Fit badge */}
        <div
          className={`absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
            fits
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {fits ? <Check size={12} /> : <X size={12} />}
          {fits ? "Fits" : "Too large"}
        </div>
        {/* Price tag */}
        <div className="absolute bottom-2 left-2 rounded-lg bg-white/90 px-2 py-1 text-lg font-bold text-penny-600 shadow-sm backdrop-blur-sm">
          ${item.price.toFixed(0)}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-stone-800">
          {item.name}
        </h3>
        <p className="mt-0.5 text-xs text-stone-400">{item.retailer}</p>

        {/* Dimensions */}
        <div className="mt-2 flex items-center gap-1 text-xs text-stone-500">
          <Ruler size={12} />
          <span>
            {item.dimensions.widthIn}&quot;W × {item.dimensions.depthIn}&quot;D
            × {item.dimensions.heightIn}&quot;H
          </span>
        </div>

        {/* Rating */}
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium text-stone-600">
              {item.rating.toFixed(1)}
            </span>
            <span className="text-xs text-stone-400">
              ({item.reviewCount})
            </span>
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-penny-500 hover:text-penny-600"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

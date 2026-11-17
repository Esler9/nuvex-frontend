"use client";

import { Heart } from "lucide-react";
import { useStore } from "@/components/store/store-provider";
import type { Product } from "@/types/content";

type Props = { product: Product; size?: "sm" | "md"; tone?: "card" | "muted" | "outline"; className?: string };

const sizes = { sm: "size-9", md: "size-11" };
const tones = {
  card: "bg-card/90 shadow-card",
  muted: "bg-surface",
  outline: "bg-card border border-border",
};

/** Corazón para guardar o quitar un producto de favoritos. */
export function FavoriteButton({ product, size = "md", tone = "card", className = "" }: Props) {
  const { isFavorite, toggleFavorite } = useStore();
  const saved = isFavorite(product.id);

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(product)}
      aria-pressed={saved}
      aria-label={saved ? `Quitar ${product.name} de favoritos` : `Guardar ${product.name} en favoritos`}
      className={`grid ${sizes[size]} place-items-center rounded-full ${tones[tone]} text-foreground transition-transform hover:scale-105 active:scale-95 ${className}`}
    >
      <Heart aria-hidden className={size === "sm" ? "size-[18px]" : "size-5"} fill={saved ? "currentColor" : "none"} strokeWidth={1.75} />
    </button>
  );
}

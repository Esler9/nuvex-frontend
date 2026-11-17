"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { useStore } from "@/components/store/store-provider";
import type { Product } from "@/types/content";

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useStore();
  const [added, setAdded] = useState(false);
  const available = !!product.prices && product.is_in_stock !== false && product.is_purchasable !== false;

  if (!available) {
    return (
      <button type="button" disabled className="min-h-11 w-full cursor-not-allowed rounded-lg bg-surface px-4 text-sm font-semibold text-muted">
        No disponible
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (addItem(product)) {
          setAdded(true);
          window.setTimeout(() => setAdded(false), 1600);
        }
      }}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-strong"
    >
      {added ? <Check aria-hidden className="size-4" /> : <ShoppingCart aria-hidden className="size-4" />}
      <span aria-live="polite">{added ? "Agregado" : "Agregar al carrito"}</span>
    </button>
  );
}

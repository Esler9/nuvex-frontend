"use client";

import { useSyncExternalStore } from "react";
import type { Product } from "@/types/content";
import { createLocalListStore } from "@/lib/local-list-store";
import { isStoredProduct } from "@/lib/favorites-store";
import { productSnapshot } from "@/lib/product-meta";

/** Últimos productos abiertos en este dispositivo. */
const recent = createLocalListStore<Product>("nuvex-recent-v1", isStoredProduct);

export const recentStore = {
  add(product: Product) {
    recent.write([productSnapshot(product), ...recent.read().filter((p) => p.id !== product.id)].slice(0, 11));
  },
};

export function useRecentProducts() {
  return useSyncExternalStore(recent.subscribe, recent.getSnapshot, recent.getServerSnapshot);
}

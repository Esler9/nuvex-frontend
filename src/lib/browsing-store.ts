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

/** Modelo de celular elegido en el verificador de compatibilidad (se usa en todas las páginas). */
export type PhoneModel = { brand: string; model: string };

const model = createLocalListStore<PhoneModel>("nuvex-phone-model-v1", (v): v is PhoneModel => {
  const m = v as PhoneModel;
  return !!m && typeof m.brand === "string" && typeof m.model === "string";
});

export const modelStore = {
  set(value: PhoneModel | null) {
    model.write(value ? [value] : []);
  },
  current(): PhoneModel | null {
    return model.read()[0] ?? null;
  },
};

export function useSelectedModel(): PhoneModel | null {
  return useSyncExternalStore(model.subscribe, model.getSnapshot, model.getServerSnapshot)[0] ?? null;
}

import type { Product } from "@/types/content";
import { createLocalListStore } from "@/lib/local-list-store";
import { productSnapshot } from "@/lib/product-meta";

/**
 * Productos guardados ("me gusta") en el navegador. Se guarda una copia mínima
 * del producto para mostrarlo; precio y existencias reales los confirma WooCommerce.
 */
export function isStoredProduct(value: unknown): value is Product {
  const v = value as Product;
  return !!v && typeof v.id === "number" && typeof v.name === "string" && typeof v.slug === "string";
}

const store = createLocalListStore<Product>("nuvex-favorites-v1", isStoredProduct);

export const favoritesStore = {
  subscribe: store.subscribe,
  getSnapshot: store.getSnapshot,
  getServerSnapshot: store.getServerSnapshot,
  toggle(product: Product) {
    const current = store.read();
    store.write(current.some((p) => p.id === product.id) ? current.filter((p) => p.id !== product.id) : [productSnapshot(product), ...current].slice(0, 100));
  },
  remove(id: number) {
    store.write(store.read().filter((p) => p.id !== id));
  },
};

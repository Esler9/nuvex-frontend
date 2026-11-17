import type { Product } from "@/types/content";
import { createLocalListStore } from "@/lib/local-list-store";

/**
 * Productos guardados ("me gusta") en el navegador. Se guarda una copia mínima
 * del producto para mostrarlo; precio y existencias reales los confirma WooCommerce.
 */
function isFavorite(value: unknown): value is Product {
  const v = value as Product;
  return !!v && typeof v.id === "number" && typeof v.name === "string" && typeof v.slug === "string";
}

function snapshot(p: Product): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    permalink: p.permalink,
    prices: p.prices,
    images: p.images?.slice(0, 1),
    is_in_stock: p.is_in_stock,
    is_purchasable: p.is_purchasable,
  };
}

const store = createLocalListStore<Product>("nuvex-favorites-v1", isFavorite);

export const favoritesStore = {
  subscribe: store.subscribe,
  getSnapshot: store.getSnapshot,
  getServerSnapshot: store.getServerSnapshot,
  toggle(product: Product) {
    const current = store.read();
    store.write(current.some((p) => p.id === product.id) ? current.filter((p) => p.id !== product.id) : [snapshot(product), ...current].slice(0, 100));
  },
  remove(id: number) {
    store.write(store.read().filter((p) => p.id !== id));
  },
};

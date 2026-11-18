"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { cartStore } from "@/lib/cart-store";
import { favoritesStore } from "@/lib/favorites-store";
import { cashOnDeliveryAvailable } from "@/lib/product-meta";
import type { CartLine, Product } from "@/types/content";

type Panel = "menu" | "cart" | "account" | "favorites";
/** Sesión del cliente. Se conectará a WooCommerce; por ahora siempre es null. */
type Customer = { name: string } | null;

type StoreContext = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  addItem: (product: Product) => boolean;
  setQuantity: (id: number, quantity: number) => void;
  removeItem: (id: number) => void;
  favorites: Product[];
  isFavorite: (id: number) => boolean;
  toggleFavorite: (product: Product) => void;
  removeFavorite: (id: number) => void;
  panel: Panel | null;
  openPanel: (panel: Panel) => void;
  closePanel: (panel: Panel) => void;
  customer: Customer;
};

const Context = createContext<StoreContext | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const favorites = useSyncExternalStore(favoritesStore.subscribe, favoritesStore.getSnapshot, favoritesStore.getServerSnapshot);
  const [panel, setPanel] = useState<Panel | null>(null);

  const addItem = useCallback((product: Product) => {
    if (!product.prices || product.is_in_stock === false || product.is_purchasable === false) return false;
    // La página de detalle envía "Nombre · Opción"; la opción se muestra aparte en el carrito.
    const [name, ...detail] = product.name.split(" · ");
    cartStore.add({
      id: product.id,
      name,
      detail: detail.join(" · ") || undefined,
      slug: product.slug,
      unitPrice: Number(product.prices.price),
      minorUnit: product.prices.currency_minor_unit,
      currency: product.prices.currency_code || "GTQ",
      image: product.images?.[0]?.src,
    });
    return true;
  }, []);

  // Solo cierra si el panel sigue siendo el activo (evita cerrar uno recién abierto).
  const closePanel = useCallback((name: Panel) => setPanel((current) => (current === name ? null : current)), []);

  const value = useMemo<StoreContext>(() => {
    const favoriteIds = new Set(favorites.map((p) => p.id));
    return {
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
      addItem,
      setQuantity: cartStore.setQuantity,
      removeItem: cartStore.remove,
      favorites,
      isFavorite: (id) => favoriteIds.has(id),
      toggleFavorite: favoritesStore.toggle,
      removeFavorite: favoritesStore.remove,
      panel,
      openPanel: setPanel,
      closePanel,
      customer: null,
    };
  }, [lines, favorites, panel, addItem, closePanel]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useStore() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}

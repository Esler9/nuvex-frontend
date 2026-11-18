"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { cartStore } from "@/lib/cart-store";
import { favoritesStore } from "@/lib/favorites-store";
import { useAccount } from "@/lib/account-store";
import type { Customer } from "@/types/account";
import type { CartLine, Product } from "@/types/content";

type Panel = "menu" | "cart" | "account" | "favorites";

type StoreContext = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  addItem: (product: Product) => boolean;
  setQuantity: (id: number, quantity: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  favorites: Product[];
  isFavorite: (id: number) => boolean;
  toggleFavorite: (product: Product) => void;
  removeFavorite: (id: number) => void;
  panel: Panel | null;
  openPanel: (panel: Panel) => void;
  closePanel: (panel: Panel) => void;
  /** Cliente con sesión iniciada en este dispositivo, o null. */
  customer: Customer | null;
  /** true sin WooCommerce configurado: cuentas y pedidos son de demostración. */
  demo: boolean;
  /** Aviso breve en la parte inferior de la pantalla (se anuncia a lectores de pantalla). */
  notify: (message: string) => void;
};

const Context = createContext<StoreContext | null>(null);

export function StoreProvider({ children, demo }: { children: ReactNode; demo: boolean }) {
  const lines = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const favorites = useSyncExternalStore(favoritesStore.subscribe, favoritesStore.getSnapshot, favoritesStore.getServerSnapshot);
  const account = useAccount();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);

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
  const notify = useCallback((text: string) => setToast({ id: Date.now(), text }), []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const customer = account?.customer ?? null;

  const value = useMemo<StoreContext>(() => {
    const favoriteIds = new Set(favorites.map((p) => p.id));
    return {
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
      addItem,
      setQuantity: cartStore.setQuantity,
      removeItem: cartStore.remove,
      clearCart: cartStore.clear,
      favorites,
      isFavorite: (id) => favoriteIds.has(id),
      toggleFavorite: favoritesStore.toggle,
      removeFavorite: favoritesStore.remove,
      panel,
      openPanel: setPanel,
      closePanel,
      customer,
      demo,
      notify,
    };
  }, [lines, favorites, panel, addItem, closePanel, customer, demo, notify]);

  return (
    <Context.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4">
        {toast && (
          <p key={toast.id} className="max-w-sm rounded-lg bg-navy px-4 py-3 text-center text-sm font-semibold text-white shadow-card-hover">
            {toast.text}
          </p>
        )}
      </div>
    </Context.Provider>
  );
}

export function useStore() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { cartStore } from "@/lib/cart-store";
import { favoritesStore } from "@/lib/favorites-store";
import { accountStore, useAccount } from "@/lib/account-store";
import { accountOrdersAction } from "@/app/(store)/actions";
import type { Customer } from "@/types/account";
import type { CartLine, Product } from "@/types/content";
import type { Promotion } from "@/types/promotions";

type Panel = "menu" | "cart" | "account" | "favorites";
export type AccountMode = "login" | "register";

type StoreContext = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  /** `parentId`: producto padre cuando se agrega una variación. */
  addItem: (product: Product, parentId?: number) => boolean;
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
  /** Pestaña con la que se abre la ventana de cuenta. */
  accountMode: AccountMode;
  setAccountMode: (mode: AccountMode) => void;
  openAccount: (mode: AccountMode) => void;
  /** Cliente con sesión iniciada en este dispositivo, o null. */
  customer: Customer | null;
  /** true sin WooCommerce configurado: cuentas y pedidos son de demostración. */
  demo: boolean;
  /** Promociones encendidas desde el panel (la vigencia por fecha se evalúa al mostrar). */
  promotions: Promotion[];
  /** Total (centavos) desde el que no se permite facturar a Consumidor Final. */
  cfLimit: number;
  /** Aviso breve en la parte inferior de la pantalla (se anuncia a lectores de pantalla). */
  notify: (message: string) => void;
};

const Context = createContext<StoreContext | null>(null);

type Props = { children: ReactNode; demo: boolean; promotions: Promotion[]; cfLimit: number };

export function StoreProvider({ children, demo, promotions, cfLimit }: Props) {
  const lines = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const favorites = useSyncExternalStore(favoritesStore.subscribe, favoritesStore.getSnapshot, favoritesStore.getServerSnapshot);
  const account = useAccount();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [accountMode, setAccountMode] = useState<AccountMode>("login");
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);

  const addItem = useCallback((product: Product, parentId?: number) => {
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
      productId: parentId && parentId !== product.id ? parentId : undefined,
      categories: product.categories?.map((c) => c.slug),
    });
    return true;
  }, []);

  // Solo cierra si el panel sigue siendo el activo (evita cerrar uno recién abierto).
  const closePanel = useCallback((name: Panel) => setPanel((current) => (current === name ? null : current)), []);
  const openPanel = useCallback((name: Panel) => {
    if (name === "account") setAccountMode("login");
    setPanel(name);
  }, []);
  const openAccount = useCallback((mode: AccountMode) => {
    setAccountMode(mode);
    setPanel("account");
  }, []);
  const notify = useCallback((text: string) => setToast({ id: Date.now(), text }), []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const customer = account?.customer ?? null;
  const email = customer?.email;

  // Al iniciar sesión o crear cuenta, se unen las compras hechas con ese correo (invitado o manuales).
  useEffect(() => {
    if (!email || !demo) return;
    let cancelled = false;
    accountOrdersAction(email)
      .then((orders) => {
        if (!cancelled) accountStore.syncServerOrders(orders);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [email, demo]);

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
      openPanel,
      closePanel,
      accountMode,
      setAccountMode,
      openAccount,
      customer,
      demo,
      promotions,
      cfLimit,
      notify,
    };
  }, [lines, favorites, panel, addItem, openPanel, closePanel, accountMode, openAccount, customer, demo, promotions, cfLimit, notify]);

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

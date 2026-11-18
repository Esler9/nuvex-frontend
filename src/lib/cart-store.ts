import type { CartLine } from "@/types/content";
import { createLocalListStore } from "@/lib/local-list-store";

/**
 * Carrito local en el navegador. Es un estado provisional de UI:
 * WooCommerce sigue siendo la fuente de verdad de precios, existencias y pedidos.
 */
function isLine(value: unknown): value is CartLine {
  const v = value as CartLine;
  return !!v && typeof v.id === "number" && typeof v.name === "string" && Number.isFinite(v.unitPrice) && Number.isInteger(v.quantity) && v.quantity > 0;
}

const store = createLocalListStore<CartLine>("nuvex-cart-v1", isLine);

export const cartStore = {
  subscribe: store.subscribe,
  getSnapshot: store.getSnapshot,
  getServerSnapshot: store.getServerSnapshot,
  add(line: Omit<CartLine, "quantity">, quantity = 1) {
    const current = store.read();
    const existing = current.find((l) => l.id === line.id);
    store.write(
      existing
        ? current.map((l) => (l.id === line.id ? { ...l, quantity: Math.min(l.quantity + quantity, 99) } : l))
        : [...current, { ...line, quantity }],
    );
  },
  setQuantity(id: number, quantity: number) {
    const q = Math.min(Math.max(Math.round(quantity), 0), 99);
    const current = store.read();
    store.write(q === 0 ? current.filter((l) => l.id !== id) : current.map((l) => (l.id === id ? { ...l, quantity: q } : l)));
  },
  remove(id: number) {
    store.write(store.read().filter((l) => l.id !== id));
  },
  clear() {
    store.write([]);
  },
};

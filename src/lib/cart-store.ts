import type { CartLine } from "@/types/content";

/**
 * Carrito local en el navegador (localStorage). Es un estado provisional de UI:
 * WooCommerce sigue siendo la fuente de verdad de precios, existencias y pedidos.
 */
const KEY = "nuvex-cart-v1";
const EMPTY: CartLine[] = [];
let lines: CartLine[] | null = null;
const listeners = new Set<() => void>();

function isLine(value: unknown): value is CartLine {
  const v = value as CartLine;
  return !!v && typeof v.id === "number" && typeof v.name === "string" && Number.isFinite(v.unitPrice) && Number.isInteger(v.quantity) && v.quantity > 0;
}

function read(): CartLine[] {
  if (lines) return lines;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    lines = Array.isArray(parsed) ? parsed.filter(isLine) : [];
  } catch {
    lines = [];
  }
  return lines;
}

function write(next: CartLine[]) {
  lines = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Almacenamiento no disponible (modo privado): el carrito vive solo en memoria.
  }
  listeners.forEach((listener) => listener());
}

export const cartStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY) {
        lines = null;
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot: read,
  getServerSnapshot: () => EMPTY,
  add(line: Omit<CartLine, "quantity">, quantity = 1) {
    const current = read();
    const existing = current.find((l) => l.id === line.id);
    write(
      existing
        ? current.map((l) => (l.id === line.id ? { ...l, quantity: Math.min(l.quantity + quantity, 99) } : l))
        : [...current, { ...line, quantity }],
    );
  },
  setQuantity(id: number, quantity: number) {
    const q = Math.min(Math.max(Math.round(quantity), 0), 99);
    write(q === 0 ? read().filter((l) => l.id !== id) : read().map((l) => (l.id === id ? { ...l, quantity: q } : l)));
  },
  remove(id: number) {
    write(read().filter((l) => l.id !== id));
  },
};

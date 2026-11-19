import "server-only";
import type { BillingData, OrderLine, OrderOrigin, OrderStatus, PaymentData, ShippingData } from "@/types/account";
import type { Promotion, StoreSettings } from "@/types/promotions";
import { dpiError, EMAIL_FORMAT, newOrderNumber, nitError, normalizeNit, orderTotals, requiresNit } from "@/lib/checkout";
import { guatemala } from "@/lib/guatemala";
import { cartPromotion } from "@/lib/promotions";
import { logEmail, mutate, newToken, normalizeEmail, read, tokenMatches, toPublicOrder, type StoredOrder } from "@/lib/server/db";

/* ---------- Lecturas para la tienda ---------- */

export const getSettings = () => read((d): StoreSettings => d.settings);

/** Promociones encendidas (la vigencia por fecha se evalúa al mostrar y al cobrar). */
export const getActivePromotions = () => read((d): Promotion[] => d.promotions.filter((p) => p.active));

/* ---------- Validación compartida (sitio y pedido manual) ---------- */

export type OrderInput = {
  lines: Array<OrderLine & { parentId?: number; categories?: string[] }>;
  email: string;
  customer: { firstName: string; lastName: string };
  shippingData: ShippingData;
  billing: BillingData;
  payment: PaymentData;
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown, min: number, max: number) => (Number.isInteger(v) && (v as number) >= min && (v as number) <= max ? (v as number) : null);

/** Limpia y valida lo que llega del navegador. Devuelve el primer error legible o los datos limpios. */
export function cleanOrderInput(raw: unknown): { ok: true; data: OrderInput } | { ok: false; error: string } {
  const r = (raw ?? {}) as Record<string, unknown>;
  const linesRaw = Array.isArray(r.lines) ? r.lines.slice(0, 50) : [];
  const lines: OrderInput["lines"] = [];
  for (const l of linesRaw as Array<Record<string, unknown>>) {
    const productId = int(l.productId, 1, 1e9);
    const quantity = int(l.quantity, 1, 999);
    const unitPrice = int(l.unitPrice, 0, 1e9);
    if (!productId || !quantity || unitPrice === null) return { ok: false, error: "Hay un producto con datos inválidos." };
    lines.push({
      productId,
      quantity,
      unitPrice,
      slug: str(l.slug, 200),
      name: str(l.name, 200) || "Producto",
      detail: str(l.detail, 120) || undefined,
      image: str(l.image, 500) || undefined,
      parentId: int(l.parentId, 1, 1e9) ?? undefined,
      categories: Array.isArray(l.categories) ? l.categories.filter((c): c is string => typeof c === "string").slice(0, 20).map((c) => c.slice(0, 100)) : undefined,
    });
  }
  if (!lines.length) return { ok: false, error: "El pedido no tiene productos." };

  const c = (r.customer ?? {}) as Record<string, unknown>;
  const s = (r.shippingData ?? {}) as Record<string, unknown>;
  const b = (r.billing ?? {}) as Record<string, unknown>;
  const p = (r.payment ?? {}) as Record<string, unknown>;
  const customer = { firstName: str(c.firstName, 60), lastName: str(c.lastName, 60) };
  const email = normalizeEmail(str(r.email, 120));
  const shippingData: ShippingData = {
    fullName: str(s.fullName, 120) || `${customer.firstName} ${customer.lastName}`.trim(),
    phone: str(s.phone, 20).replace(/\D/g, ""),
    department: str(s.department, 60),
    municipality: str(s.municipality, 80),
    zone: str(s.zone, 120),
    street: str(s.street, 200),
    references: str(s.references, 200) || undefined,
  };
  const nitRaw = str(b.nit, 20);
  const billing: BillingData = { name: str(b.name, 120), dpi: str(b.dpi, 20).replace(/\D/g, ""), ...(nitRaw ? { nit: normalizeNit(nitRaw) } : {}) };
  const method = (["deposito", "transferencia", "efectivo", "tarjeta"] as const).find((m) => m === p.method);
  const payment: PaymentData = { method: method ?? "deposito", bank: str(p.bank, 60), reference: str(p.reference, 60), date: str(p.date, 10), receiptName: str(p.receiptName, 120) || undefined };

  if (customer.firstName.length < 2) return { ok: false, error: "Escribe los nombres del cliente." };
  if (customer.lastName.length < 2) return { ok: false, error: "Escribe los apellidos del cliente." };
  if (!EMAIL_FORMAT.test(email)) return { ok: false, error: "El correo no es válido." };
  if (shippingData.phone.length !== 8) return { ok: false, error: "El teléfono debe tener 8 dígitos." };
  if (!guatemala[shippingData.department]?.includes(shippingData.municipality)) return { ok: false, error: "Revisa el departamento y municipio." };
  if (shippingData.zone.length < 2 || shippingData.street.length < 5) return { ok: false, error: "Revisa la dirección de entrega." };
  if (dpiError(billing.dpi)) return { ok: false, error: "El DPI debe tener exactamente 13 dígitos." };
  if (billing.nit && nitError(billing.nit)) return { ok: false, error: "Revisa el NIT; no es válido." };
  if (billing.name.length < 3) return { ok: false, error: "Escribe el nombre para la factura." };
  return { ok: true, data: { lines, email, customer, shippingData, billing, payment } };
}

function uniqueId(orders: StoredOrder[]) {
  for (let i = 0; i < 20; i++) {
    const id = newOrderNumber();
    if (!orders.some((o) => o.id === id)) return id;
  }
  return `${newOrderNumber()}-${Date.now() % 1000}`;
}

type Totals = { subtotal: number; shipping: number; promoDiscount: number; promoLabel?: string; discount: number; coupon?: string; total: number };

function buildOrder(data: OrderInput, totals: Totals, extra: { origin: OrderOrigin; status: OrderStatus; accountEmail?: string; demo: boolean }, orders: StoredOrder[]): StoredOrder {
  const now = new Date().toISOString();
  return {
    id: uniqueId(orders),
    createdAt: now,
    status: extra.status,
    history: extra.status === "confirmado" ? { esperando: now, confirmado: now } : { [extra.status]: now },
    lines: data.lines.map((l) => ({ productId: l.productId, slug: l.slug, name: l.name, detail: l.detail, image: l.image, unitPrice: l.unitPrice, quantity: l.quantity })),
    ...totals,
    email: data.email,
    customer: data.customer,
    shippingData: data.shippingData,
    billing: data.billing,
    payment: data.payment,
    origin: extra.origin,
    accountEmail: extra.accountEmail,
    token: newToken(),
    emails: [],
    demo: extra.demo,
  };
}

/* ---------- Pedido del sitio ---------- */

export type WebOrderExtras = { accountEmail?: string; coupon?: { code: string; value: number } };

/**
 * Crea un pedido del sitio. Recalcula los montos en el servidor (promociones vigentes y límite de CF);
 * con WooCommerce los precios se verificarán contra la Store API antes de aceptar el pedido.
 */
export async function placeWebOrder(data: OrderInput, extras: WebOrderExtras) {
  const accountEmail = extras.accountEmail ? normalizeEmail(extras.accountEmail) : undefined;
  return mutate((d) => {
    const subtotal = data.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const promo = cartPromotion(
      data.lines.map((l) => ({ id: l.productId, productId: l.parentId, categories: l.categories, unitPrice: l.unitPrice, quantity: l.quantity, name: l.name, slug: l.slug, minorUnit: 2, currency: "GTQ" })),
      d.promotions,
      Boolean(accountEmail),
    );
    const couponValue = extras.coupon && accountEmail ? Math.min(Math.max(Math.floor(extras.coupon.value), 0), 1e7) : 0;
    const t = orderTotals(subtotal, couponValue, promo.discount);
    if (requiresNit(t.total, d.settings.cfLimit) && !data.billing.nit) return { ok: false as const, error: "Esta compra requiere factura con NIT." };
    const order = buildOrder(
      data,
      { subtotal: t.subtotal, shipping: t.shipping, promoDiscount: t.promoDiscount || undefined, promoLabel: promo.label || undefined, discount: t.discount, coupon: t.discount > 0 ? extras.coupon?.code.slice(0, 20) : undefined, total: t.total } as Totals,
      { origin: "web", status: "esperando", accountEmail, demo: true },
      d.orders,
    );
    logEmail(order, "creado");
    d.orders.unshift(order);
    return { ok: true as const, order: toPublicOrder(order) };
  });
}

/* ---------- Consultas del cliente ---------- */

/** "Consultar mi pedido": número + correo. Devuelve el token del enlace o null. */
export async function lookupOrder(id: string, email: string) {
  const e = normalizeEmail(email);
  return read((d) => d.orders.find((o) => o.id === id.trim() && normalizeEmail(o.email) === e)?.token ?? null);
}

export async function getOrderForToken(id: string, token: string) {
  return read((d) => {
    const o = d.orders.find((x) => x.id === id);
    return o && token && tokenMatches(o, token) ? toPublicOrder(o) : null;
  });
}

/**
 * Une a la cuenta todas las compras hechas con ese correo (como invitado, manuales o desde otra
 * cuenta de demostración) y las devuelve sin DPI.
 */
export async function claimOrdersForAccount(email: string) {
  const e = normalizeEmail(email);
  return mutate((d) => {
    const mine = d.orders.filter((o) => normalizeEmail(o.email) === e);
    mine.forEach((o) => (o.accountEmail = e));
    return mine.map((o) => toPublicOrder(o));
  });
}

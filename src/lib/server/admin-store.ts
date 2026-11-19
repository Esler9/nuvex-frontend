import "server-only";
import type { OrderOrigin, OrderStatus } from "@/types/account";
import type { Promotion, StoreSettings } from "@/types/promotions";
import { newOrderNumber, requiresNit } from "@/lib/checkout";
import { isPaid, statusRank } from "@/lib/order-status";
import { getProduct as wcGetProduct, isWooAdminConfigured, updateProduct as wcUpdateProduct } from "@/lib/admin/woo-admin";
import { logEmail, mutate, normalizeEmail, read, saveUpload, type StoredOrder } from "@/lib/server/db";
import type { OrderInput } from "@/lib/server/orders";
import { randomBytes } from "node:crypto";

/* ---------- Pedidos ---------- */

export function matchesQuery(o: StoredOrder, q: string) {
  if (!q) return true;
  const needle = q.toLowerCase().replace(/\s+/g, " ").trim();
  const digits = needle.replace(/\D/g, "");
  const hay = [o.id, o.email, o.customer?.firstName, o.customer?.lastName, o.shippingData.fullName, o.billing.name, o.billing.nit].join(" ").toLowerCase();
  return hay.includes(needle) || (digits.length >= 4 && (o.billing.dpi.includes(digits) || o.shippingData.phone.includes(digits)));
}

export const listOrders = (q = "", origin?: OrderOrigin) => read((d) => d.orders.filter((o) => (!origin || o.origin === origin) && matchesQuery(o, q)));
export const getAdminOrder = (id: string) => read((d) => d.orders.find((o) => o.id === id) ?? null);

/** Pago confirmado y sin factura, del más antiguo al más reciente. */
export const pendingInvoices = () =>
  read((d) =>
    d.orders
      .filter((o) => isPaid(o.status) && !o.invoice)
      .sort((a, b) => (a.history.confirmado ?? a.createdAt).localeCompare(b.history.confirmado ?? b.createdAt)),
  );

function setStatus(o: StoredOrder, status: OrderStatus) {
  if (o.status === status) return;
  const now = new Date().toISOString();
  o.status = status;
  // Completa la fecha de los pasos intermedios para que la línea de tiempo del cliente sea coherente.
  for (const s of ["esperando", "confirmado", "preparando", "listo", "transporte", "enviado", "entregado"] as const) {
    if (status !== "rechazado" && statusRank(s) <= statusRank(status) && !o.history[s]) o.history[s] = now;
  }
  o.history[status] = now;
  logEmail(o, status);
}

export async function updateOrderStatus(id: string, input: { status: OrderStatus; trackingNumber?: string; rejectionReason?: string; photo?: File | null }) {
  const photo = input.photo ? await saveUpload("paquetes", input.photo) : null;
  return mutate((d) => {
    const o = d.orders.find((x) => x.id === id);
    if (!o) return false;
    if (input.trackingNumber !== undefined) {
      const number = input.trackingNumber.trim();
      o.tracking = number ? { carrier: "Cargo Expreso", number, shippedAt: o.tracking?.shippedAt ?? new Date().toISOString(), photo: photo ?? o.tracking?.photo } : photo && o.tracking ? { ...o.tracking, photo } : o.tracking;
    }
    if (photo && o.tracking) o.tracking.photo = photo;
    o.rejectionReason = input.status === "rechazado" ? input.rejectionReason?.trim() || o.rejectionReason : undefined;
    setStatus(o, input.status);
    if (input.status === "enviado" && o.tracking) o.tracking.shippedAt = o.history.enviado ?? o.tracking.shippedAt;
    return true;
  });
}

/** Al subir la factura sale de "Facturas pendientes" y se envía al correo del cliente. */
export async function attachInvoice(id: string, file: File) {
  const rel = await saveUpload("facturas", file);
  return mutate((d) => {
    const o = d.orders.find((x) => x.id === id);
    if (!o) return false;
    o.invoice = { file: rel, uploadedAt: new Date().toISOString() };
    logEmail(o, "factura");
    return true;
  });
}

/* ---------- Pedido manual (WhatsApp, tienda o teléfono) ---------- */

export type ManualExtras = { origin: OrderOrigin; shipping: number; paymentConfirmed: boolean; proof?: File | null };

/**
 * Crea un pedido manual con el mismo proceso que los del sitio. Descuenta inventario en
 * WooCommerce cuando está conectado (productos con existencias administradas).
 */
export async function createManualOrder(data: OrderInput, extras: ManualExtras) {
  const subtotal = data.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const total = subtotal + extras.shipping;
  const settings = await read((d) => d.settings);
  if (requiresNit(total, settings.cfLimit) && !data.billing.nit) return { ok: false as const, error: `Desde ${settings.cfLimit / 100} quetzales la factura debe llevar NIT.` };
  const proof = extras.proof ? await saveUpload("comprobantes", extras.proof) : null;

  const warnings: string[] = [];
  if (isWooAdminConfigured()) {
    for (const line of data.lines) {
      try {
        const p = await wcGetProduct(line.productId);
        if (p.manage_stock && typeof p.stock_quantity === "number") await wcUpdateProduct(line.productId, { stock_quantity: Math.max(0, p.stock_quantity - line.quantity) });
      } catch {
        warnings.push(`No se pudo descontar el inventario de "${line.name}".`);
      }
    }
  } else {
    warnings.push("WooCommerce no está conectado: el inventario no se descontó.");
  }

  const order = await mutate((d) => {
    const now = new Date().toISOString();
    let id = newOrderNumber();
    while (d.orders.some((o) => o.id === id)) id = newOrderNumber();
    const o: StoredOrder = {
      id,
      createdAt: now,
      status: "esperando",
      history: { esperando: now },
      lines: data.lines.map((l) => ({ productId: l.productId, slug: l.slug, name: l.name, detail: l.detail, image: l.image, unitPrice: l.unitPrice, quantity: l.quantity })),
      subtotal,
      shipping: extras.shipping,
      discount: 0,
      total,
      email: data.email,
      customer: data.customer,
      shippingData: data.shippingData,
      billing: data.billing,
      payment: data.payment,
      origin: extras.origin,
      token: randomBytes(24).toString("base64url"),
      emails: [],
      paymentProof: proof ? { file: proof, uploadedAt: now } : undefined,
      accountEmail: d.orders.find((x) => x.accountEmail && normalizeEmail(x.email) === data.email)?.accountEmail,
      demo: !isWooAdminConfigured(),
    };
    logEmail(o, "creado");
    if (extras.paymentConfirmed) setStatus(o, "confirmado");
    d.orders.unshift(o);
    return o;
  });
  return { ok: true as const, id: order.id, warnings };
}

/* ---------- Clientes ---------- */

export type CustomerRow = {
  email: string;
  name: string;
  dpi: string;
  phone: string;
  registered: boolean;
  total: number;
  orders: Array<Pick<StoredOrder, "id" | "createdAt" | "total" | "status" | "origin">>;
};

/** Todos los compradores (con y sin cuenta), agrupados por correo. */
export const listCustomers = (q = "") =>
  read((d) => {
    const map = new Map<string, CustomerRow>();
    for (const o of [...d.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
      const key = normalizeEmail(o.email);
      const row =
        map.get(key) ??
        ({
          email: key,
          name: [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(" ") || o.shippingData.fullName,
          dpi: o.billing.dpi,
          phone: o.shippingData.phone,
          registered: false,
          total: 0,
          orders: [],
        } satisfies CustomerRow);
      row.registered ||= Boolean(o.accountEmail);
      row.total += o.total;
      row.orders.push({ id: o.id, createdAt: o.createdAt, total: o.total, status: o.status, origin: o.origin });
      map.set(key, row);
    }
    const needle = q.trim().toLowerCase();
    const digits = needle.replace(/\D/g, "");
    return [...map.values()].filter((c) => !needle || c.name.toLowerCase().includes(needle) || c.email.includes(needle) || (digits.length >= 4 && (c.dpi.includes(digits) || c.phone.includes(digits))));
  });

/* ---------- Promociones y ajustes ---------- */

export const listPromotions = () => read((d) => d.promotions);
export const getPromotion = (id: string) => read((d) => d.promotions.find((p) => p.id === id) ?? null);
export const getStoreSettings = () => read((d): StoreSettings => d.settings);

export function savePromotion(input: Omit<Promotion, "id" | "createdAt"> & { id?: string }) {
  return mutate((d) => {
    const existing = input.id ? d.promotions.find((p) => p.id === input.id) : undefined;
    const promo: Promotion = { ...input, id: existing?.id ?? `promo-${randomBytes(4).toString("hex")}`, createdAt: existing?.createdAt ?? new Date().toISOString() };
    d.promotions = existing ? d.promotions.map((p) => (p.id === promo.id ? promo : p)) : [promo, ...d.promotions];
    return promo;
  });
}

export const togglePromotion = (id: string) =>
  mutate((d) => {
    const p = d.promotions.find((x) => x.id === id);
    if (p) p.active = !p.active;
  });

export const deletePromotion = (id: string) =>
  mutate((d) => {
    d.promotions = d.promotions.filter((p) => p.id !== id);
  });

export const saveSettings = (s: StoreSettings) =>
  mutate((d) => {
    d.settings = s;
  });

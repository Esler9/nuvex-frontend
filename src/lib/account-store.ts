"use client";

import { useSyncExternalStore } from "react";
import type { AccountData, BillingData, Coupon, Customer, MyReview, Order, OrderLine, PaymentData, SavedAddress, SavedBilling } from "@/types/account";
import { demoAccount, demoForeignCoupons } from "@/lib/account-demo";
import { couponState, newCouponCode, normalizeCouponCode, pointsForPurchase } from "@/lib/checkout";
import { siteConfig } from "@/lib/site-config";

/**
 * Cuenta del cliente en ESTE dispositivo (modo demostración).
 * Cuando exista el backend, estas acciones llamarán a WooCommerce; las pantallas no cambian.
 */
const KEY = "nuvex-account-v1";
let cache: AccountData | null | undefined;
const listeners = new Set<() => void>();

function isAccount(v: unknown): v is AccountData {
  const a = v as AccountData;
  return !!a && typeof a.customer?.email === "string" && [a.addresses, a.billing, a.orders, a.coupons, a.points, a.reviews].every(Array.isArray);
}

function read(): AccountData | null {
  if (cache !== undefined) return cache;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || "null");
    cache = isAccount(parsed) ? parsed : null;
  } catch {
    cache = null;
  }
  return cache;
}

function write(next: AccountData | null) {
  cache = next;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    // Sin almacenamiento disponible: la sesión vive solo en memoria.
  }
  listeners.forEach((l) => l());
}

function update(fn: (a: AccountData) => AccountData) {
  const current = read();
  if (current) write(fn(current));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = undefined;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** undefined mientras carga (render del servidor), null sin sesión. */
export function useAccount(): AccountData | null | undefined {
  return useSyncExternalStore(subscribe, read, () => undefined);
}

const id = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
const nowIso = () => new Date().toISOString();

export function pointsBalance(a: AccountData | null | undefined) {
  return a ? a.points.reduce((sum, p) => sum + p.points, 0) : 0;
}

export type CouponResult = { ok: true; coupon: Coupon } | { ok: false; error: string };

export function checkCoupon(raw: string, account: AccountData | null | undefined): CouponResult {
  const code = normalizeCouponCode(raw);
  if (!code) return { ok: false, error: "Escribe el código del cupón." };
  const own = account?.coupons.find((c) => c.code === code);
  if (own) {
    const state = couponState(own);
    if (state === "usado") return { ok: false, error: "Este cupón ya fue usado" };
    if (state === "vencido") return { ok: false, error: "Este cupón venció" };
    return { ok: true, coupon: own };
  }
  if (demoForeignCoupons.includes(code)) return { ok: false, error: account ? "Este cupón pertenece a otra cuenta" : "Inicia sesión para usar este cupón" };
  return { ok: false, error: "Este cupón no existe" };
}

/** Datos que se guardan en la cuenta para reutilizarlos en próximas compras. */
export type SaveForNextTime = { label: string; profile: Partial<Customer> };

export const accountStore = {
  /** Iniciar sesión (demostración): abre una cuenta de ejemplo con compras de muestra. */
  login(customer: Customer) {
    write(demoAccount(customer));
  },
  /** Crear cuenta: empieza vacía; sus compras como invitado se unen al sincronizar por correo. */
  register(customer: Customer) {
    const current = read();
    if (current && current.customer.email === customer.email) return;
    write({ customer, addresses: [], billing: [], orders: [], coupons: [], points: [], reviews: [] });
  },
  logout() {
    write(null);
  },
  updateProfile(patch: Partial<Customer>) {
    update((a) => ({ ...a, customer: { ...a.customer, ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined && v !== "")) } }));
  },

  /**
   * Une las compras guardadas en la tienda con ese correo (invitado, manuales) y suma los
   * Puntos NUVEX de las entregadas que aún no se habían acreditado.
   */
  syncServerOrders(orders: Order[]) {
    if (!orders.length) return;
    update((a) => {
      const byId = new Map(a.orders.map((o) => [o.id, o]));
      for (const o of orders) byId.set(o.id, { ...byId.get(o.id), ...o });
      const merged = [...byId.values()].sort((x, y) => y.createdAt.localeCompare(x.createdAt));
      const credited = new Set(a.points.map((p) => p.reason));
      const earned = siteConfig.points.enabled
        ? orders
            .filter((o) => o.status === "entregado" && !credited.has(`Compra #${o.id} entregada`))
            .map((o) => ({ id: id("p"), date: o.history.entregado ?? nowIso(), reason: `Compra #${o.id} entregada`, points: pointsForPurchase(o.total) }))
            .filter((p) => p.points > 0)
        : [];
      return { ...a, orders: merged, points: earned.length ? [...a.points, ...earned] : a.points };
    });
  },

  saveAddress(address: Omit<SavedAddress, "id" | "primary"> & { id?: string; primary?: boolean }) {
    update((a) => {
      const existing = address.id ? a.addresses.find((x) => x.id === address.id) : undefined;
      const primary = address.primary ?? existing?.primary ?? a.addresses.length === 0;
      const saved: SavedAddress = { ...address, id: existing?.id ?? id("addr"), primary };
      let list = existing ? a.addresses.map((x) => (x.id === saved.id ? saved : x)) : [...a.addresses, saved];
      if (primary) list = list.map((x) => ({ ...x, primary: x.id === saved.id }));
      return { ...a, addresses: list };
    });
  },
  deleteAddress(addressId: string) {
    update((a) => {
      const left = a.addresses.filter((x) => x.id !== addressId);
      if (left.length && !left.some((x) => x.primary)) left[0] = { ...left[0], primary: true };
      return { ...a, addresses: left };
    });
  },
  setPrimaryAddress(addressId: string) {
    update((a) => ({ ...a, addresses: a.addresses.map((x) => ({ ...x, primary: x.id === addressId })) }));
  },

  saveBilling(data: BillingData & { id?: string }) {
    update((a) => {
      const saved: SavedBilling = { ...data, id: data.id ?? id("bill") };
      const exists = a.billing.some((b) => b.id === saved.id);
      return { ...a, billing: exists ? a.billing.map((b) => (b.id === saved.id ? saved : b)) : [...a.billing, saved] };
    });
  },
  deleteBilling(billingId: string) {
    update((a) => ({ ...a, billing: a.billing.filter((b) => b.id !== billingId) }));
  },

  /**
   * Registra en este dispositivo el pedido que la tienda ya guardó. Con cuenta, marca el cupón
   * como usado y (si el cliente lo pidió) guarda dirección, facturación y perfil para la próxima vez.
   */
  recordOrder(order: Order, save?: SaveForNextTime) {
    if (!read()) {
      guestOrders.push(order);
      return;
    }
    update((acc) => {
      let next: AccountData = {
        ...acc,
        orders: [order, ...acc.orders.filter((o) => o.id !== order.id)],
        coupons: acc.coupons.map((c) => (order.coupon && c.code === order.coupon ? { ...c, usedAt: order.createdAt, usedInOrder: order.id } : c)),
      };
      if (save) {
        const label = save.label.trim() || "Mi dirección";
        const sameAddress = acc.addresses.find((x) => x.label.toLowerCase() === label.toLowerCase());
        const saved: SavedAddress = { ...order.shippingData, id: sameAddress?.id ?? id("addr"), label, email: order.email, primary: sameAddress?.primary ?? acc.addresses.length === 0 };
        const billing: BillingData = { name: order.billing.name, dpi: save.profile.dpi ?? order.billing.dpi, ...(order.billing.nit ? { nit: order.billing.nit } : {}) };
        const sameBilling = acc.billing.find((b) => b.dpi === billing.dpi && (b.nit ?? "") === (billing.nit ?? ""));
        next = {
          ...next,
          customer: { ...acc.customer, ...Object.fromEntries(Object.entries(save.profile).filter(([, v]) => v)) },
          addresses: sameAddress ? acc.addresses.map((x) => (x.id === saved.id ? saved : x)) : [...acc.addresses, saved],
          billing: sameBilling ? acc.billing.map((b) => (b.id === sameBilling.id ? { ...b, ...billing } : b)) : [...acc.billing, { ...billing, id: id("bill") }],
        };
      }
      return next;
    });
  },

  /** Reemplaza el comprobante de un pedido rechazado y lo vuelve a poner en verificación. */
  resubmitPayment(orderId: string, payment: PaymentData) {
    update((a) => ({
      ...a,
      orders: a.orders.map((o) => (o.id === orderId ? { ...o, payment, status: "esperando", rejectionReason: undefined, history: { ...o.history, esperando: nowIso() } } : o)),
    }));
  },

  redeem(points: number): Coupon | null {
    const a = read();
    const cfg = siteConfig.points;
    if (!a || points < cfg.minRedeem || points > pointsBalance(a)) return null;
    const created = new Date();
    const expires = new Date(created.getTime() + cfg.couponDays * 86400000);
    const coupon: Coupon = { code: newCouponCode(), value: points * cfg.pointValue, createdAt: created.toISOString(), expiresAt: expires.toISOString() };
    write({
      ...a,
      coupons: [coupon, ...a.coupons],
      points: [...a.points, { id: id("p"), date: coupon.createdAt, reason: `Canje por cupón ${coupon.code}`, points: -points }],
    });
    return coupon;
  },

  /** Primera opinión de un producto en una compra: suma puntos. Editar no vuelve a sumar. */
  submitReview(input: Omit<MyReview, "id" | "date" | "pointsAwarded">): number {
    const a = read();
    if (!a) return 0;
    const existing = a.reviews.find((r) => r.orderId === input.orderId && r.productId === input.productId);
    const date = nowIso();
    if (existing) {
      write({ ...a, reviews: a.reviews.map((r) => (r.id === existing.id ? { ...existing, ...input, date } : r)) });
      return 0;
    }
    const award = siteConfig.points.enabled ? siteConfig.points.perReview : 0;
    const review: MyReview = { ...input, id: id("rev"), date, pointsAwarded: award };
    write({
      ...a,
      reviews: [review, ...a.reviews],
      points: award ? [...a.points, { id: id("p"), date, reason: `Opinión de ${input.productName}`, points: award }] : a.points,
    });
    return award;
  },
  /** Al borrar una opinión se descuentan los puntos que dio (evita ganar dos veces por la misma). */
  deleteReview(reviewId: string) {
    update((a) => {
      const r = a.reviews.find((x) => x.id === reviewId);
      if (!r) return a;
      return {
        ...a,
        reviews: a.reviews.filter((x) => x.id !== reviewId),
        points: r.pointsAwarded ? [...a.points, { id: id("p"), date: nowIso(), reason: `Opinión borrada: ${r.productName}`, points: -r.pointsAwarded }] : a.points,
      };
    });
  },
};

/** Pedidos hechos sin sesión: solo existen mientras la pestaña esté abierta (para la confirmación). */
const guestOrders: Order[] = [];
export function findGuestOrder(orderId: string) {
  return guestOrders.find((o) => o.id === orderId) ?? null;
}

export function reviewFor(a: AccountData, orderId: string, productId: number) {
  return a.reviews.find((r) => r.orderId === orderId && r.productId === productId);
}

/** Productos de compras entregadas que aún no tienen opinión (una por producto en cada compra). */
export function pendingReviews(a: AccountData): Array<{ orderId: string; line: OrderLine }> {
  return a.orders
    .filter((o) => o.status === "entregado")
    .flatMap((o) => o.lines.filter((l) => !reviewFor(a, o.id, l.productId)).map((line) => ({ orderId: o.id, line })));
}

import type { Promotion } from "@/types/promotions";
import type { CartLine } from "@/types/content";
import { gtq } from "@/lib/format";

/**
 * Reglas de las promociones de la tienda (se usan igual en el sitio, el carrito y el servidor).
 * Montos en centavos. Si varias promociones aplican a un producto, gana la de mayor descuento.
 */
export type PromoTarget = { ids: number[]; categories: string[] };

export function isPromotionLive(p: Promotion, now = Date.now()) {
  if (!p.active) return false;
  if (p.startsAt && Date.parse(p.startsAt) > now) return false;
  if (p.endsAt && Date.parse(p.endsAt) < now) return false;
  return true;
}

function appliesTo(p: Promotion, t: PromoTarget) {
  if (p.scope === "all") return true;
  if (p.scope === "category") return t.categories.some((c) => p.categorySlugs.includes(c));
  return t.ids.some((id) => p.productIds.includes(id));
}

/** Descuento por unidad; nunca deja el precio en negativo. */
export function promoAmount(p: Promotion, unitPrice: number) {
  const raw = p.type === "percent" ? Math.round((unitPrice * Math.min(Math.max(p.value, 0), 100)) / 100) : Math.max(p.value, 0);
  return Math.min(raw, unitPrice);
}

/** "5%" o "Q10.00", para "Oferta especial [5%]". */
export function promoBadge(p: Promotion) {
  return p.type === "percent" ? `${p.value}%` : gtq(p.value);
}

function best(promos: Promotion[], unitPrice: number) {
  let winner: { promo: Promotion; amount: number } | null = null;
  for (const promo of promos) {
    const amount = promoAmount(promo, unitPrice);
    if (amount > 0 && (!winner || amount > winner.amount)) winner = { promo, amount };
  }
  return winner;
}

export type PromoView = {
  /** Promoción que el cliente obtiene ahora, con su descuento por unidad. */
  applied: { promo: Promotion; amount: number; final: number } | null;
  /** Promoción solo para registrados que obtendría si inicia sesión. */
  loginHint: Promotion | null;
};

export function promoView(promos: Promotion[], target: PromoTarget, unitPrice: number, loggedIn: boolean, now = Date.now()): PromoView {
  if (!promos.length || unitPrice <= 0) return { applied: null, loginHint: null };
  const live = promos.filter((p) => isPromotionLive(p, now) && appliesTo(p, target));
  const eligible = best(loggedIn ? live : live.filter((p) => !p.registeredOnly), unitPrice);
  const forMembers = loggedIn ? null : best(live.filter((p) => p.registeredOnly), unitPrice);
  return {
    applied: eligible ? { ...eligible, final: unitPrice - eligible.amount } : null,
    loginHint: forMembers && (!eligible || forMembers.amount > eligible.amount) ? forMembers.promo : null,
  };
}

export function lineTarget(line: Pick<CartLine, "id" | "productId" | "categories">): PromoTarget {
  return { ids: [line.id, ...(line.productId ? [line.productId] : [])], categories: line.categories ?? [] };
}

/** Descuento total de promociones en el carrito y la etiqueta para el resumen. */
export function cartPromotion(lines: CartLine[], promos: Promotion[], loggedIn: boolean, now = Date.now()) {
  let discount = 0;
  const used = new Map<string, Promotion>();
  for (const line of lines) {
    const { applied } = promoView(promos, lineTarget(line), line.unitPrice, loggedIn, now);
    if (!applied) continue;
    discount += applied.amount * line.quantity;
    used.set(applied.promo.id, applied.promo);
  }
  const list = [...used.values()];
  const label = list.length === 1 ? `Oferta especial ${promoBadge(list[0])}` : list.length > 1 ? "Ofertas especiales" : "";
  return { discount, label };
}

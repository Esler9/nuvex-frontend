import type { BillingData, Coupon, CouponState, ShippingData } from "@/types/account";
import { siteConfig } from "@/lib/site-config";
import { guatemala } from "@/lib/guatemala";

/**
 * Reglas de la orden de compra (montos en centavos).
 * El envío gratis se calcula con el subtotal ANTES del descuento, y el descuento nunca supera el subtotal.
 */
export function orderTotals(subtotal: number, couponValue = 0) {
  const free = subtotal >= siteConfig.freeShippingThreshold;
  const shipping = subtotal > 0 && !free ? siteConfig.checkout.shippingCost : 0;
  const discount = Math.min(Math.max(couponValue, 0), subtotal);
  return { subtotal, shipping, freeShipping: free, missingForFree: Math.max(siteConfig.freeShippingThreshold - subtotal, 0), discount, total: subtotal - discount + shipping };
}

export function couponState(c: Coupon, now = new Date()): CouponState {
  if (c.usedAt) return "usado";
  return new Date(c.expiresAt).getTime() < now.getTime() ? "vencido" : "disponible";
}

/** Formato de los cupones generados con Puntos NUVEX. */
export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function newCouponCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return "NUVEX-" + Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function newOrderNumber() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 100000;
  return `02-${String(n).padStart(5, "0")}`;
}

/** Valida un NIT guatemalteco (dígito verificador módulo 11; "K" equivale a 10). */
export function isValidNit(value: string) {
  const nit = value.replace(/[\s-]/g, "").toUpperCase();
  if (!/^\d{1,12}[\dK]$/.test(nit)) return false;
  const body = nit.slice(0, -1);
  const check = nit.slice(-1);
  let sum = 0;
  for (let i = 0; i < body.length; i++) sum += Number(body[i]) * (body.length + 1 - i);
  const expected = (11 - (sum % 11)) % 11;
  return check === (expected === 10 ? "K" : String(expected));
}

export type CheckoutForm = ShippingData & { email: string; needsNit: boolean; nit: string; nitName: string; dpi: string };
export type FieldErrors = Partial<Record<keyof CheckoutForm, string>>;

const digits = (v: string) => v.replace(/\D/g, "");

/** Errores de los datos de envío y facturación, con el mensaje que se muestra debajo de cada campo. */
export function validateCheckoutForm(f: CheckoutForm): FieldErrors {
  const e: FieldErrors = {};
  if (f.fullName.trim().length < 3) e.fullName = "Escribe tu nombre completo.";
  if (digits(f.phone).length !== 8) e.phone = "El teléfono debe tener 8 dígitos.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "Escribe un correo válido, por ejemplo nombre@correo.com.";
  if (!guatemala[f.department]) e.department = "Elige un departamento.";
  if (!guatemala[f.department]?.includes(f.municipality)) e.municipality = "Elige un municipio.";
  if (f.zone.trim().length < 2) e.zone = "Escribe la zona, barrio o colonia.";
  if (f.street.trim().length < 5) e.street = "Escribe la dirección exacta.";
  if (f.needsNit) {
    if (!isValidNit(f.nit)) e.nit = "Revisa el NIT; no es válido.";
    if (f.nitName.trim().length < 3) e.nitName = "Escribe el nombre para la factura.";
  }
  if (digits(f.dpi).length !== 13) e.dpi = "El DPI debe tener 13 dígitos.";
  return e;
}

export function billingFromForm(f: CheckoutForm): BillingData {
  return { name: f.fullName.trim(), dpi: digits(f.dpi), ...(f.needsNit ? { nit: f.nit.replace(/[\s-]/g, "").toUpperCase(), nitName: f.nitName.trim() } : {}) };
}

export function shippingFromForm(f: CheckoutForm): ShippingData {
  return {
    fullName: f.fullName.trim(),
    phone: digits(f.phone),
    department: f.department,
    municipality: f.municipality,
    zone: f.zone.trim(),
    street: f.street.trim(),
    references: f.references?.trim() || undefined,
  };
}

export function formatAddress(s: Pick<ShippingData, "zone" | "street" | "municipality" | "department">) {
  return [s.street, s.zone, s.municipality, s.department].filter(Boolean).join(", ");
}

export function invoiceLabel(b: BillingData) {
  return b.nit ? `${b.nitName || b.name} · NIT ${b.nit}` : "Consumidor Final (CF)";
}

/** Dirección de rastreo; {guia} se reemplaza por el número de guía. */
export function trackingHref(number: string) {
  return siteConfig.checkout.trackingUrl.replace("{guia}", encodeURIComponent(number));
}

/** Puntos que da un pedido pagado (se suman cuando pasa a "Entregado"). */
export function pointsForPurchase(total: number) {
  const { points, perAmount } = siteConfig.points.earn;
  return Math.floor(total / perAmount) * points;
}

export function pointsValue(points: number) {
  return points * siteConfig.points.pointValue;
}

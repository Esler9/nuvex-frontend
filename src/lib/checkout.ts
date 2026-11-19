import type { BillingData, Coupon, CouponState, ShippingData } from "@/types/account";
import { siteConfig } from "@/lib/site-config";
import { guatemala } from "@/lib/guatemala";

/**
 * Reglas de la orden de compra (montos en centavos).
 * El envío gratis se calcula con el subtotal ANTES de descuentos. Primero se aplica la promoción
 * de la tienda y después el cupón; ningún descuento deja el total de productos en negativo.
 */
export function orderTotals(subtotal: number, couponValue = 0, promoDiscount = 0) {
  const free = subtotal >= siteConfig.freeShippingThreshold;
  const shipping = subtotal > 0 && !free ? siteConfig.checkout.shippingCost : 0;
  const promo = Math.min(Math.max(promoDiscount, 0), subtotal);
  const discount = Math.min(Math.max(couponValue, 0), subtotal - promo);
  return {
    subtotal,
    shipping,
    freeShipping: free,
    missingForFree: Math.max(siteConfig.freeShippingThreshold - subtotal, 0),
    promoDiscount: promo,
    discount,
    total: subtotal - promo - discount + shipping,
  };
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

/** Formato de NIT: solo números y la letra K, con guion opcional antes del último dígito. */
export const NIT_FORMAT = /^\d{1,12}-?[\dK]$/i;

export function normalizeNit(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

/** Valida un NIT guatemalteco: formato y dígito verificador módulo 11 ("K" equivale a 10). */
export function nitError(value: string): string | null {
  const raw = value.trim().toUpperCase();
  if (!raw) return "Escribe el NIT.";
  if (!NIT_FORMAT.test(raw)) return "El NIT solo puede tener números y la letra K, con guion opcional antes del último dígito.";
  const nit = normalizeNit(raw);
  const body = nit.slice(0, -1);
  let sum = 0;
  for (let i = 0; i < body.length; i++) sum += Number(body[i]) * (body.length + 1 - i);
  const expected = (11 - (sum % 11)) % 11;
  return nit.slice(-1) === (expected === 10 ? "K" : String(expected)) ? null : "Revisa el NIT; no es válido.";
}

export const isValidNit = (value: string) => nitError(value) === null;

const digits = (v: string) => v.replace(/\D/g, "");

/** DPI: exactamente 13 dígitos (se permiten espacios al escribir). */
export function dpiError(value: string): string | null {
  if (!value.trim()) return "Escribe tu número de DPI.";
  return /^[\d\s]+$/.test(value) && digits(value).length === 13 ? null : "El DPI debe tener exactamente 13 dígitos.";
}

/** "1234567890123" → "1234 5678 90123". */
export function formatDpi(dpi: string) {
  const d = digits(dpi);
  return d.length === 13 ? `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8)}` : d;
}

/** Oculta el DPI excepto los últimos 4 dígitos: "•••• •••• •1234". */
export function maskDpi(dpi: string) {
  const d = digits(dpi);
  if (d.length < 4) return "•••• •••• •••••";
  return `•••• •••• •${d.slice(-4)}`;
}

/** ¿El total obliga a facturar con NIT? (sin opción de Consumidor Final). */
export function requiresNit(total: number, cfLimit: number) {
  return cfLimit > 0 && total >= cfLimit;
}

export type CheckoutForm = Omit<ShippingData, "fullName"> & {
  firstName: string;
  lastName: string;
  email: string;
  needsNit: boolean;
  nit: string;
  /** Nombre para la factura (se llena con Nombres + Apellidos y se puede editar). */
  invoiceName: string;
  invoiceNameEdited: boolean;
  dpi: string;
  /** Solo sin sesión: crear la cuenta al terminar la compra. */
  createAccount: boolean;
  password: string;
};
export type FieldErrors = Partial<Record<keyof CheckoutForm, string>>;

export const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const fullName = (f: Pick<CheckoutForm, "firstName" | "lastName">) => [f.firstName.trim(), f.lastName.trim()].filter(Boolean).join(" ");

/**
 * Errores de los datos de envío y facturación, con el mensaje que se muestra debajo de cada campo.
 * `withAccount` = el cliente pidió crear su cuenta (exige contraseña).
 */
export function validateCheckoutForm(f: CheckoutForm, opts: { withAccount?: boolean } = {}): FieldErrors {
  const e: FieldErrors = {};
  if (f.firstName.trim().length < 2) e.firstName = "Escribe tus nombres.";
  if (f.lastName.trim().length < 2) e.lastName = "Escribe tus apellidos.";
  if (digits(f.phone).length !== 8) e.phone = "El teléfono debe tener 8 dígitos.";
  if (!EMAIL_FORMAT.test(f.email.trim())) e.email = "Escribe un correo válido, por ejemplo nombre@correo.com.";
  if (!guatemala[f.department]) e.department = "Elige un departamento.";
  if (!guatemala[f.department]?.includes(f.municipality)) e.municipality = "Elige un municipio.";
  if (f.zone.trim().length < 2) e.zone = "Escribe la zona, barrio o colonia.";
  if (f.street.trim().length < 5) e.street = "Escribe la dirección exacta.";
  if (f.needsNit) {
    const nit = nitError(f.nit);
    if (nit) e.nit = nit;
  }
  if (f.invoiceName.trim().length < 3) e.invoiceName = "Escribe el nombre para la factura.";
  const dpi = dpiError(f.dpi);
  if (dpi) e.dpi = dpi;
  if (opts.withAccount && f.password.length < 8) e.password = "La contraseña debe tener al menos 8 caracteres.";
  return e;
}

export function billingFromForm(f: CheckoutForm): BillingData {
  return { name: f.invoiceName.trim(), dpi: digits(f.dpi), ...(f.needsNit ? { nit: normalizeNit(f.nit) } : {}) };
}

export function shippingFromForm(f: CheckoutForm): ShippingData {
  return {
    fullName: fullName(f),
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

export function invoiceLabel(b: Pick<BillingData, "name" | "nit">) {
  return b.nit ? `${b.name} · NIT ${b.nit}` : `${b.name ? `${b.name} · ` : ""}Consumidor Final (CF)`;
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

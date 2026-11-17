import type { CardVariant, Product } from "@/types/content";
import { formatMoney, stripTags } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";

/** Porcentaje de descuento real según precio regular vs. actual de WooCommerce (0 si no hay oferta). */
export function discountPercent(p: Product) {
  if (!p.prices) return 0;
  const regular = Number(p.prices.regular_price);
  const current = Number(p.prices.price);
  if (!(regular > current && current > 0)) return 0;
  return Math.round((1 - current / regular) * 100);
}

/** Precio anterior formateado, solo si el producto está en oferta. */
export function regularPriceLabel(p: Product) {
  if (!p.prices || discountPercent(p) === 0) return null;
  return formatMoney(Number(p.prices.regular_price), p.prices.currency_minor_unit, p.prices.currency_code || "GTQ");
}

/** Calificación promedio y número de reseñas; null si aún no tiene reseñas. */
export function ratingInfo(p: Product) {
  const value = Number(p.average_rating);
  const count = p.review_count ?? 0;
  return count > 0 && value > 0 ? { value: value.toFixed(1), count } : null;
}

/** Marca (WooCommerce Brands) o atributo "Marca"/"Material". */
export function brandOrMaterial(p: Product) {
  return p.brands?.[0]?.name ?? p.attributes?.find((a) => /marca|material/i.test(a.name))?.terms[0]?.name ?? null;
}

/** Envío gratis si el producto tiene la etiqueta configurada o su precio alcanza el mínimo. */
export function hasFreeShipping(p: Product) {
  if (p.tags?.some((t) => t.slug === siteConfig.freeShippingTag)) return true;
  if (!p.prices) return false;
  const inCents = (Number(p.prices.price) / 10 ** p.prices.currency_minor_unit) * 100;
  return inCents >= siteConfig.freeShippingThreshold;
}

export function hasFastShipping(p: Product) {
  return siteConfig.fastShipping.enabled && p.is_in_stock !== false;
}

/** Lee "tarjeta: 1" o "tarjeta: 2" de la descripción de una categoría de WooCommerce. */
export function parseCardVariant(description?: string): CardVariant | null {
  const match = stripTags(description || "").match(/tarjeta\s*[:=]\s*([12])/i);
  return match ? (Number(match[1]) as CardVariant) : null;
}

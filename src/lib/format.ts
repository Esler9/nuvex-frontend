import type { Product } from "@/types/content";

/** Formatea un monto en unidades menores (p. ej. centavos) con locale es-GT. */
export function formatMoney(minor: number, minorUnit = 2, currency = "GTQ") {
  return new Intl.NumberFormat("es-GT", { style: "currency", currency }).format(minor / 10 ** minorUnit);
}

export function money(p: Product) {
  if (!p.prices) return "Consultar";
  return formatMoney(Number(p.prices.price), p.prices.currency_minor_unit, p.prices.currency_code || "GTQ");
}

export function stripTags(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

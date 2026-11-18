import type { CardVariant, Product, ProductAttribute, ProductInfo } from "@/types/content";
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

/** Precio en centavos de quetzal, para compararlo con el mínimo de envío gratis. */
export function priceInCents(p: Product) {
  if (!p.prices) return 0;
  return Math.round((Number(p.prices.price) / 10 ** p.prices.currency_minor_unit) * 100);
}

/** Calificación promedio y número de reseñas; null si aún no tiene reseñas. */
export function ratingInfo(p: Product) {
  const value = Number(p.average_rating);
  const count = p.review_count ?? 0;
  return count > 0 && value > 0 ? { value: value.toFixed(1), count, raw: value } : null;
}

function attribute(p: Product, pattern: RegExp) {
  return p.attributes?.find((a) => pattern.test(a.name));
}

/** Marca: WooCommerce Brands o atributo "Marca". */
export function brandName(p: Product) {
  return p.brands?.[0]?.name ?? attribute(p, /marca/i)?.terms[0]?.name ?? null;
}

/** Marca o, si no hay, atributo "Material" (para las tarjetas). */
export function brandOrMaterial(p: Product) {
  return brandName(p) ?? attribute(p, /material/i)?.terms[0]?.name ?? null;
}

function hasTag(p: Product, slug: string) {
  return !!p.tags?.some((t) => t.slug === slug);
}

/** Insignia "Original [marca]" o "Genérico de calidad", según etiquetas del producto. */
export function productBadge(p: Product): { kind: "original" | "generic"; label: string } | null {
  if (hasTag(p, siteConfig.productTags.original)) {
    const brand = brandName(p);
    return { kind: "original", label: brand ? `Original ${brand}` : "Original" };
  }
  if (hasTag(p, siteConfig.productTags.generic)) return { kind: "generic", label: "Genérico de calidad" };
  return null;
}

/** Envío gratis si el producto tiene la etiqueta configurada o su precio alcanza el mínimo. */
export function hasFreeShipping(p: Product) {
  return hasTag(p, siteConfig.freeShippingTag) || priceInCents(p) >= siteConfig.freeShippingThreshold;
}

export function hasFastShipping(p: Product) {
  return siteConfig.fastShipping.enabled && p.is_in_stock !== false;
}


/** Estado de existencia a partir de los datos de WooCommerce (nunca se inventa la cantidad). */
export function stockInfo(p: Product): { inStock: boolean; label: string; tone: "ok" | "low" | "out" } {
  if (p.is_in_stock === false) return { inStock: false, label: "Sin existencia", tone: "out" };
  const low = p.low_stock_remaining;
  if (typeof low === "number" && low > 0) return { inStock: true, label: `${low} en existencia`, tone: low <= 5 ? "low" : "ok" };
  const text = stripTags(p.stock_availability?.text || "");
  const n = Number(text.match(/\d+/)?.[0]);
  if (n > 0) return { inStock: true, label: `${n} en existencia`, tone: n <= 5 ? "low" : "ok" };
  return { inStock: true, label: text || "Disponible", tone: "ok" };
}

/** Lee "tarjeta: 1" o "tarjeta: 2" de la descripción de una categoría de WooCommerce. */
export function parseCardVariant(description?: string): CardVariant | null {
  const match = stripTags(description || "").match(/tarjeta\s*[:=]\s*([12])/i);
  return match ? (Number(match[1]) as CardVariant) : null;
}

/** Copia mínima de un producto para guardarla en el navegador (favoritos, vistos). */
export function productSnapshot(p: Product): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    permalink: p.permalink,
    prices: p.prices,
    images: p.images?.slice(0, 1),
    categories: p.categories,
    on_sale: p.on_sale,
    average_rating: p.average_rating,
    review_count: p.review_count,
    brands: p.brands,
    attributes: p.attributes?.filter((a) => /marca|material|compatib/i.test(a.name)),
    tags: p.tags,
    is_in_stock: p.is_in_stock,
    is_purchasable: p.is_purchasable,
  };
}

/** Fecha estimada: hoy + días hábiles (sin domingos), en la zona horaria de la tienda. */
export function deliveryEstimate(now = new Date()) {
  const { minDays, maxDays, timeZone } = siteConfig.shipping;
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now).split("-").map(Number);
  const addBusinessDays = (n: number) => {
    const date = new Date(Date.UTC(y, m - 1, d));
    for (let added = 0; added < n; ) {
      date.setUTCDate(date.getUTCDate() + 1);
      if (date.getUTCDay() !== 0) added++;
    }
    return date;
  };
  const from = addBusinessDays(minDays);
  const to = addBusinessDays(maxDays);
  const month = (date: Date) => new Intl.DateTimeFormat("es-GT", { month: "long", timeZone: "UTC" }).format(date);
  return from.getUTCMonth() === to.getUTCMonth()
    ? `Recíbelo entre el ${from.getUTCDate()} y el ${to.getUTCDate()} de ${month(to)}`
    : `Recíbelo entre el ${from.getUTCDate()} de ${month(from)} y el ${to.getUTCDate()} de ${month(to)}`;
}

const listItems = (html: string) => [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => stripTags(m[1])).filter(Boolean);

/**
 * Extrae secciones de la descripción del producto. En WooCommerce se escriben con
 * títulos (Encabezado 3): "Características", "Especificaciones", "Contenido de la caja",
 * "Garantía" y "Preguntas frecuentes" (cada pregunta en una viñeta: "¿Pregunta? Respuesta").
 * Un enlace a un archivo .mp4 en la descripción se usa como video de la galería.
 */
export function parseProductInfo(html: string, attributes: ProductAttribute[] = []): ProductInfo {
  const info: ProductInfo = { introHtml: "", features: [], specs: [], box: [], warranty: "", faqs: [], video: null };
  info.video = html.match(/https?:\/\/[^"'\s<>]+\.mp4/i)?.[0] ?? null;

  const first = html.search(/<h[2-4][^>]*>/i);
  const intro = (first === -1 ? html : html.slice(0, first)).replace(/<video[\s\S]*?<\/video>|<a[^>]+\.mp4[^>]*>[\s\S]*?<\/a>|https?:\/\/[^"'\s<>]+\.mp4/gi, "");
  info.introHtml = stripTags(intro) ? intro : "";

  for (const m of html.matchAll(/<h([2-4])[^>]*>([\s\S]*?)<\/h\1>([\s\S]*?)(?=<h[2-4][^>]*>|$)/gi)) {
    const title = stripTags(m[2]).toLowerCase();
    const body = m[3];
    if (/caracter/.test(title)) info.features = listItems(body);
    else if (/especific/.test(title)) {
      const rows = [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((r) => [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => stripTags(c[1])));
      const fromRows = rows.filter((r) => r.length >= 2).map((r) => [r[0], r[1]] as [string, string]);
      const fromList = listItems(body)
        .map((t) => t.match(/^(.+?)\s*[:|]\s*(.+)$/))
        .filter((x): x is RegExpMatchArray => !!x)
        .map((x) => [x[1], x[2]] as [string, string]);
      info.specs = fromRows.length ? fromRows : fromList;
    } else if (/contenido|caja/.test(title)) info.box = listItems(body).length ? listItems(body) : [stripTags(body)].filter(Boolean);
    else if (/garant/.test(title)) info.warranty = stripTags(body);
    else if (/pregunt/.test(title)) {
      info.faqs = listItems(body)
        .map((t) => {
          const i = t.indexOf("?");
          return i > 0 ? { q: t.slice(0, i + 1).trim(), a: t.slice(i + 1).trim() } : null;
        })
        .filter((f): f is { q: string; a: string } => !!f && !!f.a);
    }
  }

  if (!info.specs.length) {
    info.specs = attributes.filter((a) => !a.has_variations && a.terms.length).map((a) => [a.name, a.terms.map((t) => t.name).join(", ")]);
  }
  return info;
}

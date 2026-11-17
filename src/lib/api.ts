import type { Article, CardVariant, Category, DiscoverCategory, HomeSection, Product, ProductOption, ProductOptions, ProductReview, WpPage } from "@/types/content";
import { siteConfig } from "@/lib/site-config";
import { sampleByCategory, sampleProducts, sampleReviews, sampleSections, sampleVariations } from "@/lib/sample-catalog";
import { parseCardVariant } from "@/lib/product-meta";

export { money } from "@/lib/format";

const wordpress = (process.env.WORDPRESS_URL || "").replace(/\/$/, "");
const commerce = (process.env.WOOCOMMERCE_URL || wordpress).replace(/\/$/, "");
const storeApi = commerce + "/wp-json/wc/store/v1";

/** Sin tienda configurada se muestra el catálogo de ejemplo, claramente señalado en la UI. */
export const isDemoCatalog = !/^https?:\/\//.test(commerce);

async function request<T>(url: string): Promise<T | null> {
  if (!url.startsWith("https://") && !url.startsWith("http://")) return null;
  try {
    const response = await fetch(url, { next: { revalidate: 300 }, headers: { Accept: "application/json" } });
    if (!response.ok) {
      console.error("Headless API status", response.status);
      return null;
    }
    return (await response.json()) as T;
  } catch {
    console.error("Headless API unavailable");
    return null;
  }
}

function cleanSearch(value?: string) {
  return (value || "").trim().slice(0, 100);
}

export async function getCategories(): Promise<Category[]> {
  return (await request<Category[]>(storeApi + "/products/categories")) ?? [];
}

type ProductQuery = { search?: string; category?: string; perPage?: number; page?: number };

export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
  const search = cleanSearch(query.search);
  const perPage = Math.min(Math.max(query.perPage ?? 12, 1), 50);
  const page = Math.min(Math.max(Math.floor(query.page ?? 1), 1), 100);

  if (isDemoCatalog) {
    let items = query.category ? sampleByCategory(query.category) : sampleProducts;
    if (search) items = items.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    return items.slice((page - 1) * perPage, page * perPage);
  }

  const params = new URLSearchParams({ per_page: String(perPage), page: String(page) });
  if (search) params.set("search", search);
  if (query.category) {
    const category = (await getCategories()).find((c) => c.slug === query.category);
    if (!category) return [];
    params.set("category", String(category.id));
  }
  return (await request<Product[]>(`${storeApi}/products?${params}`)) ?? [];
}

export async function getProduct(slug: string): Promise<Product | null> {
  if (isDemoCatalog) return sampleProducts.find((p) => p.slug === slug) ?? null;
  const items = await request<Product[]>(storeApi + "/products?slug=" + encodeURIComponent(slug));
  return items?.[0] ?? null;
}

/** Variaciones (color, capacidad...) con su precio, existencia e imágenes. */
export async function getProductOptions(p: Product): Promise<ProductOptions> {
  const variations = (p.variations ?? []).slice(0, 24);
  if (!variations.length) return null;
  const attr = p.attributes?.find((a) => a.has_variations);
  const attrName = attr?.name ?? variations[0].attributes[0]?.name ?? "Opción";
  const details = isDemoCatalog
    ? variations.map((v) => sampleVariations[v.id] ?? null)
    : await Promise.all(variations.map((v) => request<Product>(`${storeApi}/products/${v.id}`)));

  const items: ProductOption[] = [];
  variations.forEach((v, i) => {
    const detail = details[i];
    if (!detail) return;
    const raw = v.attributes.find((a) => a.name.toLowerCase() === attrName.toLowerCase())?.value ?? v.attributes[0]?.value ?? "";
    const term = attr?.terms.find((t) => t.slug === raw || t.name.toLowerCase() === raw.toLowerCase());
    items.push({ id: v.id, label: term?.name ?? raw, product: detail });
  });
  if (!items.length) return null;
  if (attr) {
    const order = (label: string) => attr.terms.findIndex((t) => t.name === label);
    items.sort((a, b) => order(a.label) - order(b.label));
  }
  const defaultLabel = attr?.terms.find((t) => t.default)?.name;
  const defaultId = items.find((i) => i.label === defaultLabel)?.id ?? items.find((i) => i.product.is_in_stock !== false)?.id ?? items[0].id;
  const kind = /color/i.test(attrName) ? "color" : "pill";
  return { title: kind === "color" ? "Colores" : attrName, kind, items, defaultId };
}

type StoreReview = { id: number; reviewer: string; review: string; rating: number; verified: boolean; date_created: string };

/** Reseñas aprobadas de WooCommerce. */
export async function getProductReviews(productId: number, offset = 0, limit = 2): Promise<ProductReview[]> {
  const safeOffset = Math.max(0, Math.floor(offset));
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 20);
  if (isDemoCatalog) return (sampleReviews[productId] ?? []).slice(safeOffset, safeOffset + safeLimit);
  const items = await request<StoreReview[]>(`${storeApi}/products/reviews?product_id=${productId}&per_page=${safeLimit}&offset=${safeOffset}`);
  return (items ?? []).map((r) => ({ id: r.id, reviewer: r.reviewer, review: r.review, rating: r.rating, verified: !!r.verified, date_created: r.date_created }));
}

/** Estilo de tarjeta/galería de un producto según su categoría. */
export function cardVariantFor(p: Product, categories: Category[]): CardVariant {
  for (const ref of p.categories ?? []) {
    const fromWoo = parseCardVariant(categories.find((c) => c.id === ref.id || c.slug === ref.slug)?.description);
    if (fromWoo) return fromWoo;
    const fromConfig = siteConfig.homeSections.find((s) => s.slug === ref.slug)?.cardVariant;
    if (fromConfig) return fromConfig;
  }
  return 2;
}

export async function getCardVariantForProduct(p: Product): Promise<CardVariant> {
  return cardVariantFor(p, isDemoCatalog ? [] : await getCategories());
}

/** Tiras de la página de inicio según siteConfig.homeSections. */
export async function getHomeSections(): Promise<HomeSection[]> {
  if (isDemoCatalog) return sampleSections(siteConfig.homeSections);
  const categories = await getCategories();
  return Promise.all(
    siteConfig.homeSections.map(async (section) => {
      const category = categories.find((c) => c.slug === section.slug);
      const products = category
        ? ((await request<Product[]>(`${storeApi}/products?per_page=10&category=${category.id}`)) ?? [])
        : [];
      return { ...section, cardVariant: parseCardVariant(category?.description) ?? section.cardVariant, products };
    }),
  );
}

/** Círculos de "Descubre más": usa la imagen de cada categoría en WooCommerce si existe. */
export async function getDiscoverCategories(): Promise<DiscoverCategory[]> {
  const items: DiscoverCategory[] = siteConfig.discover.categories;
  if (isDemoCatalog) return items;
  const categories = await getCategories();
  return items.map((item) => {
    const image = categories.find((c) => c.slug === item.slug)?.image;
    return { ...item, image: image?.src ? { src: image.src, alt: image.alt || "" } : null };
  });
}

export async function getArticles(): Promise<Article[]> {
  return (await request<Article[]>(wordpress + "/wp-json/wp/v2/posts?per_page=6&_fields=id,slug,date,title,excerpt,content")) ?? [];
}

export async function getArticle(slug: string): Promise<Article | null> {
  const items = await request<Article[]>(wordpress + "/wp-json/wp/v2/posts?slug=" + encodeURIComponent(slug) + "&_fields=id,slug,date,title,excerpt,content");
  return items?.[0] ?? null;
}

/** Páginas publicadas de WordPress (políticas, ayuda, términos...). */
export async function getPage(slug: string): Promise<WpPage | null> {
  const items = await request<WpPage[]>(wordpress + "/wp-json/wp/v2/pages?status=publish&slug=" + encodeURIComponent(slug) + "&_fields=id,slug,title,excerpt,content");
  return items?.[0] ?? null;
}

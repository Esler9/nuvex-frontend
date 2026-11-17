import type { Article, Category, HomeSection, Product, WpPage } from "@/types/content";
import { siteConfig } from "@/lib/site-config";
import { sampleByCategory, sampleProducts, sampleSections } from "@/lib/sample-catalog";

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

type ProductQuery = { search?: string; category?: string; perPage?: number };

export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
  const search = cleanSearch(query.search);
  const perPage = Math.min(Math.max(query.perPage ?? 12, 1), 50);

  if (isDemoCatalog) {
    let items = query.category ? sampleByCategory(query.category) : sampleProducts;
    if (search) items = items.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    return items.slice(0, perPage);
  }

  const params = new URLSearchParams({ per_page: String(perPage) });
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
      return { ...section, products };
    }),
  );
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

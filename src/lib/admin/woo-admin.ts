import "server-only";
import type { Paginated, WcAdminCategory, WcAdminProduct, WcCategoryInput, WcImage, WcProductInput, WcStatus } from "@/types/admin";

const origin = (process.env.WOOCOMMERCE_URL || process.env.WORDPRESS_URL || "").replace(/\/$/, "");
const wcBase = origin + "/wp-json/wc/v3";
const wpBase = origin + "/wp-json/wp/v2";

/** Error con mensaje apto para mostrar en el panel (sin credenciales ni cuerpos crudos). */
export class AdminApiError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

export function isWooAdminConfigured() {
  return origin.startsWith("https://") && Boolean(process.env.WC_CONSUMER_KEY && process.env.WC_CONSUMER_SECRET);
}

export function isMediaUploadConfigured() {
  return origin.startsWith("https://") && Boolean(process.env.WP_API_USER && process.env.WP_APPLICATION_PASSWORD);
}

function basic(user: string, pass: string) {
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

async function parseError(response: Response): Promise<AdminApiError> {
  let message = `WooCommerce respondió ${response.status}`;
  try {
    const body = (await response.json()) as { message?: unknown };
    if (typeof body.message === "string") message = body.message.replace(/<[^>]*>/g, "").slice(0, 300);
  } catch {
    /* cuerpo no JSON */
  }
  if (response.status === 401 || response.status === 403) message = "Credenciales de WooCommerce inválidas o sin permisos de escritura.";
  return new AdminApiError(message, response.status);
}

async function wc<T>(path: string, init: { method?: string; body?: unknown; query?: Record<string, string> } = {}) {
  if (!isWooAdminConfigured()) throw new AdminApiError("La API de WooCommerce no está configurada en el servidor.", 503);
  const url = new URL(wcBase + path);
  for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, v);
  let response: Response;
  try {
    response = await fetch(url, {
      method: init.method ?? "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: basic(process.env.WC_CONSUMER_KEY!, process.env.WC_CONSUMER_SECRET!),
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    console.error("WooCommerce admin API unavailable", path.split("?")[0]);
    throw new AdminApiError("No se pudo conectar con WooCommerce.", 503);
  }
  if (!response.ok) {
    const error = await parseError(response);
    console.error("WooCommerce admin API status", response.status, init.method ?? "GET", path.split("?")[0]);
    throw error;
  }
  const total = Number(response.headers.get("X-WP-Total") ?? 0);
  const totalPages = Number(response.headers.get("X-WP-TotalPages") ?? 1);
  return { data: (await response.json()) as T, total, totalPages };
}

/* ---------- Productos ---------- */

export type ProductListQuery = { page?: number; search?: string; status?: WcStatus | "any"; category?: number };

export async function listProducts(q: ProductListQuery = {}): Promise<Paginated<WcAdminProduct>> {
  const query: Record<string, string> = {
    per_page: "20",
    page: String(Math.min(Math.max(Math.floor(q.page ?? 1), 1), 500)),
    status: q.status ?? "any",
    orderby: "date",
    order: "desc",
  };
  if (q.search) query.search = q.search.slice(0, 100);
  if (q.category) query.category = String(q.category);
  const { data, total, totalPages } = await wc<WcAdminProduct[]>("/products", { query });
  return { items: data, total, totalPages };
}

export async function getProduct(id: number) {
  return (await wc<WcAdminProduct>(`/products/${id}`)).data;
}

export async function createProduct(input: WcProductInput) {
  return (await wc<WcAdminProduct>("/products", { method: "POST", body: { type: "simple", ...input } })).data;
}

export async function updateProduct(id: number, input: Partial<WcProductInput>) {
  return (await wc<WcAdminProduct>(`/products/${id}`, { method: "PUT", body: input })).data;
}

/** Envía el producto a la papelera de WordPress (recuperable desde wp-admin). */
export async function trashProduct(id: number) {
  await wc(`/products/${id}`, { method: "DELETE", query: { force: "false" } });
}

/* ---------- Categorías ---------- */

export async function listCategories(): Promise<WcAdminCategory[]> {
  const all: WcAdminCategory[] = [];
  for (let page = 1; page <= 10; page++) {
    const { data, totalPages } = await wc<WcAdminCategory[]>("/products/categories", {
      query: { per_page: "100", page: String(page), orderby: "name", hide_empty: "false" },
    });
    all.push(...data);
    if (page >= totalPages) break;
  }
  return all;
}

export async function getCategory(id: number) {
  return (await wc<WcAdminCategory>(`/products/categories/${id}`)).data;
}

export async function createCategory(input: WcCategoryInput) {
  return (await wc<WcAdminCategory>("/products/categories", { method: "POST", body: input })).data;
}

export async function updateCategory(id: number, input: Partial<WcCategoryInput>) {
  return (await wc<WcAdminCategory>(`/products/categories/${id}`, { method: "PUT", body: input })).data;
}

/** Las categorías no tienen papelera: WooCommerce exige force=true. Los productos quedan sin esa categoría. */
export async function deleteCategory(id: number) {
  await wc(`/products/categories/${id}`, { method: "DELETE", query: { force: "true" } });
}

/* ---------- Medios ---------- */

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export function validateImage(file: File) {
  if (!IMAGE_TYPES[file.type]) return "Formato no permitido. Usa JPG, PNG o WebP.";
  if (file.size > MAX_IMAGE_BYTES) return "La imagen supera 4 MB.";
  return null;
}

/** Sube una imagen a la Biblioteca de medios de WordPress con una contraseña de aplicación. */
export async function uploadImage(file: File, alt: string): Promise<WcImage> {
  if (!isMediaUploadConfigured()) throw new AdminApiError("La subida de imágenes no está configurada (WP_API_USER / WP_APPLICATION_PASSWORD).", 503);
  const invalid = validateImage(file);
  if (invalid) throw new AdminApiError(invalid, 400);
  const base = (file.name.replace(/\.[^.]+$/, "") || "imagen").normalize("NFD").replace(/[^\w-]+/g, "-").slice(0, 60);
  const filename = `${base}.${IMAGE_TYPES[file.type]}`;
  let response: Response;
  try {
    response = await fetch(wpBase + "/media", {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: basic(process.env.WP_API_USER!, process.env.WP_APPLICATION_PASSWORD!.replace(/\s+/g, "")),
        "Content-Type": file.type,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
      body: Buffer.from(await file.arrayBuffer()),
    });
  } catch {
    throw new AdminApiError("No se pudo conectar con WordPress para subir la imagen.", 503);
  }
  if (!response.ok) {
    console.error("WordPress media upload status", response.status);
    throw await parseError(response);
  }
  const media = (await response.json()) as { id: number; source_url: string };
  if (alt) {
    await fetch(`${wpBase}/media/${media.id}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: basic(process.env.WP_API_USER!, process.env.WP_APPLICATION_PASSWORD!.replace(/\s+/g, "")),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ alt_text: alt.slice(0, 200) }),
    }).catch(() => undefined);
  }
  return { id: media.id, src: media.source_url, alt };
}

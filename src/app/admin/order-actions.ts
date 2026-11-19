"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { OrderOrigin, OrderStatus } from "@/types/account";
import type { FormState } from "@/types/admin";
import type { PromotionScope, PromotionType } from "@/types/promotions";
import { requireAdmin } from "@/lib/admin/session";
import { files, oneOf, text } from "@/lib/admin/validation";
import { getCategories, getProducts, isDemoCatalog } from "@/lib/api";
import { sampleProducts } from "@/lib/sample-catalog";
import { uploadError } from "@/lib/server/db";
import { cleanOrderInput } from "@/lib/server/orders";
import { attachInvoice, createManualOrder, deletePromotion, savePromotion, saveSettings, togglePromotion, updateOrderStatus } from "@/lib/server/admin-store";

const STATUSES: OrderStatus[] = ["esperando", "rechazado", "confirmado", "preparando", "listo", "transporte", "enviado", "entregado"];
const ORIGINS: OrderOrigin[] = ["web", "whatsapp", "tienda", "telefono"];
const IMAGES = ["image/jpeg", "image/png", "image/webp"];

const orderPath = (id: string) => `/admin/pedidos/${encodeURIComponent(id)}`;

/** Quetzales escritos ("2,500.00", "Q35") → centavos. null si no es un monto válido. */
function cents(value: string) {
  const clean = value.replace(/[Qq\s,]/g, "");
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

/* ---------- Estado, pago y factura ---------- */

export async function updateStatusAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id", 20);
  const status = oneOf(text(form, "status", 20), STATUSES, "esperando");
  const [photo] = files(form, "photo");
  if (photo && uploadError(photo, IMAGES)) redirect(`${orderPath(id)}?error=${encodeURIComponent("La foto debe ser JPG, PNG o WebP de máximo 5 MB.")}`);
  const ok = await updateOrderStatus(id, { status, trackingNumber: form.has("tracking") ? text(form, "tracking", 40) : undefined, rejectionReason: text(form, "reason", 300), photo });
  redirect(`${orderPath(id)}?${ok ? "guardado=1" : "error=" + encodeURIComponent("No se encontró el pedido.")}`);
}

export async function confirmPaymentAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id", 20);
  await updateOrderStatus(id, { status: "confirmado" });
  redirect(`${orderPath(id)}?guardado=1`);
}

export async function uploadInvoiceAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id", 20);
  const [pdf] = files(form, "invoice");
  const invalid = !pdf ? "Elige el PDF de la factura." : uploadError(pdf, ["application/pdf"]) ? "La factura debe ser un PDF de máximo 5 MB." : null;
  if (invalid) redirect(`${orderPath(id)}?error=${encodeURIComponent(invalid)}`);
  await attachInvoice(id, pdf);
  redirect(`${orderPath(id)}?factura=1`);
}

/* ---------- Pedido manual ---------- */

export async function createManualOrderAction(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  let payload: unknown;
  try {
    payload = JSON.parse(text(form, "payload", 100_000));
  } catch {
    return { error: "No se pudo leer el pedido. Recarga la página e intenta de nuevo." };
  }
  const clean = cleanOrderInput(payload);
  if (!clean.ok) return { error: clean.error };
  const shipping = cents(text(form, "shipping", 20) || "0");
  if (shipping === null) return { error: "Revisa el costo de envío.", fieldErrors: { shipping: "Monto inválido. Usa números, p. ej. 35.00" } };
  const [proof] = files(form, "proof");
  if (proof && uploadError(proof, [...IMAGES, "application/pdf"])) return { error: "El comprobante debe ser JPG, PNG, WebP o PDF de máximo 5 MB.", fieldErrors: { proof: "Formato o tamaño no permitido." } };
  const result = await createManualOrder(clean.data, {
    origin: oneOf(text(form, "origin", 20), ORIGINS, "whatsapp"),
    shipping,
    paymentConfirmed: form.get("paymentConfirmed") === "on",
    proof: proof ?? null,
  });
  if (!result.ok) return { error: result.error };
  const warn = result.warnings.length ? `&aviso=${encodeURIComponent(result.warnings.join(" "))}` : "";
  redirect(`${orderPath(result.id)}?creado=1${warn}`);
}

export type CatalogHit = { id: number; name: string; slug: string; price: number; image?: string; categories: string[] };

/** Búsqueda en el inventario para el pedido manual y las promociones. */
export async function searchCatalogAction(q: string): Promise<CatalogHit[]> {
  await requireAdmin();
  const query = typeof q === "string" ? q.trim().slice(0, 80) : "";
  const products = await getProducts({ search: query, perPage: 12 });
  return products
    .filter((p) => p.prices)
    .map((p) => ({ id: p.id, name: p.name, slug: p.slug, price: Number(p.prices!.price), image: p.images?.[0]?.thumbnail || p.images?.[0]?.src, categories: p.categories?.map((c) => c.slug) ?? [] }));
}

/** Categorías para elegir en una promoción. */
export async function catalogCategories(): Promise<Array<{ slug: string; name: string }>> {
  await requireAdmin();
  if (isDemoCatalog) {
    const map = new Map<string, string>();
    for (const p of sampleProducts) for (const c of p.categories ?? []) map.set(c.slug, c.name);
    return [...map].map(([slug, name]) => ({ slug, name }));
  }
  return (await getCategories()).map((c) => ({ slug: c.slug, name: c.name }));
}

/* ---------- Promociones ---------- */

function refreshStorefront() {
  revalidatePath("/", "layout");
}

/** "2026-12-01" → inicio o fin de ese día en hora de Guatemala. */
function dayIso(value: string, end: boolean) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return `${value}T${end ? "23:59:59" : "00:00:00"}-06:00`;
}

export async function savePromotionAction(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const fieldErrors: Record<string, string> = {};
  const name = text(form, "name", 80);
  if (!name) fieldErrors.name = "Ponle un nombre (solo se ve en el panel).";
  const type = oneOf<PromotionType>(text(form, "type", 10), ["percent", "fixed"], "percent");
  const scope = oneOf<PromotionScope>(text(form, "scope", 10), ["all", "category", "products"], "all");
  const raw = text(form, "value", 20);
  const value = type === "percent" ? Number(raw) : cents(raw);
  if (type === "percent" && !(Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 90)) fieldErrors.value = "Escribe un porcentaje entero entre 1 y 90.";
  if (type === "fixed" && (value === null || value <= 0)) fieldErrors.value = "Escribe un monto mayor que cero, p. ej. 10.00";
  const categorySlugs = form.getAll("categories").filter((v): v is string => typeof v === "string").map((v) => v.slice(0, 100)).slice(0, 50);
  const productIds = [...new Set(form.getAll("products").map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 200);
  if (scope === "category" && !categorySlugs.length) fieldErrors.categories = "Elige al menos una categoría.";
  if (scope === "products" && !productIds.length) fieldErrors.products = "Elige al menos un producto.";
  const startsAt = dayIso(text(form, "startsAt", 10), false);
  const endsAt = dayIso(text(form, "endsAt", 10), true);
  if (startsAt && endsAt && startsAt > endsAt) fieldErrors.endsAt = "La fecha de fin debe ser posterior a la de inicio.";
  if (Object.keys(fieldErrors).length) return { error: "Revisa los campos marcados.", fieldErrors };

  await savePromotion({
    id: text(form, "id", 40) || undefined,
    name,
    type,
    value: value as number,
    scope,
    categorySlugs: scope === "category" ? categorySlugs : [],
    productIds: scope === "products" ? productIds : [],
    registeredOnly: form.get("registeredOnly") === "on",
    startsAt,
    endsAt,
    active: form.get("active") === "on",
  });
  refreshStorefront();
  redirect("/admin/promociones?guardado=1");
}

export async function togglePromotionAction(form: FormData) {
  await requireAdmin();
  await togglePromotion(text(form, "id", 40));
  refreshStorefront();
  redirect("/admin/promociones");
}

export async function deletePromotionAction(form: FormData) {
  await requireAdmin();
  await deletePromotion(text(form, "id", 40));
  refreshStorefront();
  redirect("/admin/promociones?eliminado=1");
}

/* ---------- Ajustes ---------- */

export async function saveSettingsAction(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const limit = cents(text(form, "cfLimit", 20));
  if (limit === null || limit <= 0) return { error: "Revisa el monto.", fieldErrors: { cfLimit: "Escribe un monto válido, p. ej. 2500.00" } };
  await saveSettings({ cfLimit: limit });
  refreshStorefront();
  redirect("/admin/ajustes?guardado=1");
}

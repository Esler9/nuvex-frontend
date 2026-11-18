"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { FormState, WcCategoryInput, WcProductInput } from "@/types/admin";
import { createSession, destroySession, isAdminConfigured, requireAdmin, verifyCredentials } from "@/lib/admin/session";
import { clearFailures, isRateLimited, registerFailure } from "@/lib/admin/rate-limit";
import {
  AdminApiError,
  createCategory,
  createProduct,
  deleteCategory,
  getProduct,
  trashProduct,
  updateCategory,
  updateProduct,
  uploadImage,
  validateImage,
} from "@/lib/admin/woo-admin";
import { STATUSES, STOCK_STATUSES, files, ids, oneOf, positiveId, price, safeAdminPath, text } from "@/lib/admin/validation";

function apiMessage(error: unknown) {
  return error instanceof AdminApiError ? error.message : "Ocurrió un error inesperado. Intenta de nuevo.";
}

/** El catálogo público usa revalidate de 5 min; tras editar se invalida para reflejar cambios de inmediato. */
function refreshStorefront() {
  revalidatePath("/", "layout");
}

/* ---------- Sesión ---------- */

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  if (!isAdminConfigured()) return { error: "El panel no está configurado en el servidor." };
  const ip = ((await headers()).get("x-forwarded-for") || "local").split(",")[0].trim();
  if (isRateLimited(ip)) return { error: "Demasiados intentos. Espera 15 minutos e intenta de nuevo." };

  const email = text(form, "email", 200);
  const password = typeof form.get("password") === "string" ? (form.get("password") as string).slice(0, 200) : "";
  if (!email || !password) return { error: "Ingresa tu correo y contraseña." };

  if (!verifyCredentials(email, password)) {
    registerFailure(ip);
    return { error: "Correo o contraseña incorrectos." };
  }
  clearFailures(ip);
  await createSession(email);
  redirect(safeAdminPath(form.get("next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

/* ---------- Productos ---------- */

export async function saveProductAction(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = positiveId(form.get("id"));
  const fieldErrors: Record<string, string> = {};

  const name = text(form, "name", 200);
  if (!name) fieldErrors.name = "El nombre es obligatorio.";

  const input: WcProductInput = {
    name,
    status: oneOf(text(form, "status", 20), STATUSES, "draft"),
    sku: text(form, "sku", 100),
    short_description: text(form, "short_description", 5000),
    description: text(form, "description", 50000),
    categories: ids(form, "categories").map((c) => ({ id: c })),
  };

  // Precio y existencias solo aplican a productos simples; las variaciones se gestionan en wp-admin.
  const existing = id ? await getProduct(id).catch(() => null) : null;
  if (id && !existing) return { error: "No se encontró el producto." };
  const isSimple = !existing || existing.type === "simple";

  if (isSimple) {
    const regular = price(text(form, "regular_price", 20));
    const sale = price(text(form, "sale_price", 20));
    if (!regular.ok) fieldErrors.regular_price = "Precio inválido. Usa números, p. ej. 149.99";
    if (!sale.ok) fieldErrors.sale_price = "Precio inválido. Usa números, p. ej. 129.99";
    if (regular.ok && sale.ok && sale.value && (!regular.value || Number(sale.value) >= Number(regular.value))) {
      fieldErrors.sale_price = "El precio de oferta debe ser menor que el precio regular.";
    }
    if (regular.ok) input.regular_price = regular.value;
    if (sale.ok) input.sale_price = sale.value;

    input.manage_stock = form.get("manage_stock") === "on";
    if (input.manage_stock) {
      const qty = Number(text(form, "stock_quantity", 10));
      if (!Number.isInteger(qty) || qty < 0) fieldErrors.stock_quantity = "Ingresa una cantidad entera de 0 o más.";
      else input.stock_quantity = qty;
    } else {
      input.stock_status = oneOf(text(form, "stock_status", 20), STOCK_STATUSES, "instock");
    }
  }

  const newImages = files(form, "images").slice(0, 4);
  for (const file of newImages) {
    const invalid = validateImage(file);
    if (invalid) fieldErrors.images = invalid;
  }
  if (Object.keys(fieldErrors).length) return { error: "Revisa los campos marcados.", fieldErrors };

  let savedId: number;
  try {
    const altBase = name.slice(0, 120);
    const uploaded = [];
    for (const file of newImages) uploaded.push(await uploadImage(file, altBase));
    input.images = [...ids(form, "keep_images"), ...uploaded.map((u) => u.id)].map((imageId) => ({ id: imageId }));

    savedId = id ? (await updateProduct(id, input)).id : (await createProduct(input)).id;
  } catch (error) {
    return { error: apiMessage(error) };
  }
  refreshStorefront();
  redirect(`/admin/productos/${savedId}?guardado=1`);
}

export async function trashProductAction(form: FormData) {
  await requireAdmin();
  const id = positiveId(form.get("id"));
  if (!id) redirect("/admin/productos");
  try {
    await trashProduct(id);
  } catch (error) {
    redirect(`/admin/productos/${id}?error=${encodeURIComponent(apiMessage(error))}`);
  }
  refreshStorefront();
  redirect("/admin/productos?eliminado=1");
}

/* ---------- Categorías ---------- */

export async function saveCategoryAction(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = positiveId(form.get("id"));
  const fieldErrors: Record<string, string> = {};

  const name = text(form, "name", 120);
  if (!name) fieldErrors.name = "El nombre es obligatorio.";
  const slug = text(form, "slug", 120).toLowerCase();
  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fieldErrors.slug = "Solo minúsculas, números y guiones (p. ej. fundas-iphone).";
  const parent = positiveId(form.get("parent")) ?? 0;
  if (id && parent === id) fieldErrors.parent = "Una categoría no puede ser su propia superior.";

  const [imageFile] = files(form, "image");
  if (imageFile) {
    const invalid = validateImage(imageFile);
    if (invalid) fieldErrors.image = invalid;
  }
  if (Object.keys(fieldErrors).length) return { error: "Revisa los campos marcados.", fieldErrors };

  const input: WcCategoryInput = { name, parent, description: text(form, "description", 2000) };
  if (slug) input.slug = slug;

  try {
    if (imageFile) input.image = { id: (await uploadImage(imageFile, name)).id };
    else if (form.get("remove_image") === "on") input.image = { id: 0 };
    if (id) await updateCategory(id, input);
    else await createCategory(input);
  } catch (error) {
    return { error: apiMessage(error) };
  }
  refreshStorefront();
  redirect("/admin/categorias?guardado=1");
}

export async function deleteCategoryAction(form: FormData) {
  await requireAdmin();
  const id = positiveId(form.get("id"));
  if (!id) redirect("/admin/categorias");
  try {
    await deleteCategory(id);
  } catch (error) {
    redirect(`/admin/categorias/${id}?error=${encodeURIComponent(apiMessage(error))}`);
  }
  refreshStorefront();
  redirect("/admin/categorias?eliminado=1");
}

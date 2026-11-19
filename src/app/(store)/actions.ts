"use server";

import { redirect } from "next/navigation";
import type { Order } from "@/types/account";
import { isDemoCatalog } from "@/lib/api";
import { EMAIL_FORMAT } from "@/lib/checkout";
import { claimOrdersForAccount, cleanOrderInput, lookupOrder, placeWebOrder, type WebOrderExtras } from "@/lib/server/orders";
import { allow, clientIp } from "@/lib/server/throttle";

export type PlaceOrderResult = { ok: true; order: Order } | { ok: false; error: string };

/**
 * Guarda el pedido del sitio en el sistema de la tienda, con o sin cuenta.
 * Solo en modo demostración: con WooCommerce el pedido se creará con la Store API.
 */
export async function placeOrderAction(raw: unknown, extras: WebOrderExtras): Promise<PlaceOrderResult> {
  if (!isDemoCatalog) return { ok: false, error: "Los pedidos en línea se habilitarán pronto." };
  if (!allow(`order:${await clientIp()}`, 10, 15 * 60_000)) return { ok: false, error: "Demasiados pedidos seguidos. Espera unos minutos e intenta de nuevo." };
  const clean = cleanOrderInput(raw);
  if (!clean.ok) return clean;
  const accountEmail = typeof extras?.accountEmail === "string" && EMAIL_FORMAT.test(extras.accountEmail) ? extras.accountEmail : undefined;
  const coupon = extras?.coupon && typeof extras.coupon.code === "string" && Number.isFinite(extras.coupon.value) ? extras.coupon : undefined;
  try {
    return await placeWebOrder(clean.data, { accountEmail, coupon });
  } catch {
    console.error("No se pudo guardar el pedido");
    return { ok: false, error: "No pudimos guardar tu pedido. Intenta de nuevo." };
  }
}

export type LookupState = { error?: string } | undefined;

/** "Consultar mi pedido": número de compra + correo → detalle del pedido. */
export async function lookupOrderAction(_: LookupState, form: FormData): Promise<LookupState> {
  const id = String(form.get("id") ?? "").trim().replace(/^#/, "").slice(0, 20);
  const email = String(form.get("email") ?? "").trim().slice(0, 120);
  if (!id || !EMAIL_FORMAT.test(email)) return { error: "Escribe tu número de compra y un correo válido." };
  if (!allow(`lookup:${await clientIp()}`, 10, 15 * 60_000)) return { error: "Demasiados intentos. Espera 15 minutos e intenta de nuevo." };
  const token = await lookupOrder(id, email);
  if (!token) return { error: "No encontramos una compra con ese número y correo. Revisa los datos." };
  redirect(`/pedido/${encodeURIComponent(id)}?t=${token}`);
}

/**
 * Compras hechas con el correo de la cuenta (invitado, manuales). Solo en demostración, donde
 * la cuenta vive en el dispositivo; con WooCommerce se leerán con la sesión real del cliente.
 */
export async function accountOrdersAction(email: string): Promise<Order[]> {
  if (!isDemoCatalog || typeof email !== "string" || !EMAIL_FORMAT.test(email)) return [];
  if (!allow(`sync:${await clientIp()}`, 30, 15 * 60_000)) return [];
  try {
    return await claimOrdersForAccount(email);
  } catch {
    return [];
  }
}

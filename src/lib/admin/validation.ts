import "server-only";
import type { WcStatus, WcStockStatus } from "@/types/admin";

export const STATUSES: WcStatus[] = ["publish", "draft", "pending", "private"];
export const STOCK_STATUSES: WcStockStatus[] = ["instock", "outofstock", "onbackorder"];

export function text(form: FormData, key: string, max: number) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function positiveId(value: unknown) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function ids(form: FormData, key: string) {
  return [...new Set(form.getAll(key).map(positiveId).filter((n): n is number => n !== null))];
}

export function files(form: FormData, key: string) {
  return form.getAll(key).filter((f): f is File => typeof f === "object" && f !== null && "size" in f && f.size > 0);
}

/** Precio en formato WooCommerce ("150" o "149.99"). Vacío = sin precio. */
export function price(value: string) {
  const normalized = value.replace(",", ".");
  if (normalized === "") return { ok: true as const, value: "" };
  return /^\d{1,9}(\.\d{1,2})?$/.test(normalized) ? { ok: true as const, value: normalized } : { ok: false as const };
}

export function oneOf<T extends string>(value: string, options: readonly T[], fallback: T): T {
  return (options as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function safeAdminPath(value: unknown) {
  return typeof value === "string" && value.startsWith("/admin") && !value.startsWith("//") && !value.includes("\\") ? value : "/admin";
}

import "server-only";
import { headers } from "next/headers";

/** Límite simple en memoria por clave (por proceso). Frena abusos de formularios públicos. */
const hits = new Map<string, { count: number; resetAt: number }>();

export function allow(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

export async function clientIp() {
  return ((await headers()).get("x-forwarded-for") || "local").split(",")[0].trim();
}

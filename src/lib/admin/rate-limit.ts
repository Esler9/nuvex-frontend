import "server-only";

/** Límite simple en memoria para intentos de login (por proceso). Suficiente para un único administrador. */
const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string) {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < Date.now()) return false;
  return entry.count >= MAX_ATTEMPTS;
}

export function registerFailure(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else entry.count += 1;
  if (attempts.size > 1000) for (const [k, v] of attempts) if (v.resetAt < now) attempts.delete(k);
}

export function clearFailures(key: string) {
  attempts.delete(key);
}

import "server-only";
import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "nuvex_admin";
const SESSION_HOURS = 8;

type SessionPayload = { sub: string; exp: number };

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  return value && value.length >= 32 ? value : null;
}

/** El panel solo se habilita con todas las variables de servidor presentes. */
export function isAdminConfigured() {
  return Boolean(secret() && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH?.includes(":"));
}

function sign(data: string, key: string) {
  return createHmac("sha256", key).update(data).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Compara correo y contraseña contra ADMIN_EMAIL y ADMIN_PASSWORD_HASH ("salt:hash" scrypt en hex). */
export function verifyCredentials(email: string, password: string) {
  const expectedEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const stored = process.env.ADMIN_PASSWORD_HASH || "";
  const [salt, hash] = stored.split(":");
  if (!expectedEmail || !salt || !hash || !/^[0-9a-f]+$/i.test(hash)) return false;

  const expected = Buffer.from(hash, "hex");
  // Se calcula siempre el hash para no revelar por tiempo de respuesta si el correo existe.
  const candidate = scryptSync(password, salt, expected.length);
  const passwordOk = timingSafeEqual(candidate, expected);
  const emailOk = safeEqual(email.trim().toLowerCase(), expectedEmail);
  return passwordOk && emailOk;
}

export async function createSession(email: string) {
  const key = secret();
  if (!key) throw new Error("ADMIN_SESSION_SECRET no configurado");
  const payload: SessionPayload = { sub: email.trim().toLowerCase(), exp: Date.now() + SESSION_HOURS * 3600_000 };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const store = await cookies();
  store.set(SESSION_COOKIE, `${data}.${sign(data, key)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Devuelve el correo de la sesión si la cookie es válida, no expiró y pertenece al admin actual. */
export async function getSession(): Promise<string | null> {
  const key = secret();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!key || !token) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature || !safeEqual(signature, sign(data, key))) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    const admin = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    if (typeof payload.exp !== "number" || payload.exp < Date.now() || payload.sub !== admin) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

/** Llamar al inicio de cada página y Server Action del panel. */
export async function requireAdmin() {
  const email = await getSession();
  if (!email) redirect("/admin/login");
  return email;
}

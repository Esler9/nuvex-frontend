import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Order, OrderOrigin, OrderStatus } from "@/types/account";
import type { Promotion, StoreSettings } from "@/types/promotions";
import { siteConfig } from "@/lib/site-config";

/**
 * Almacén provisional del servidor para pedidos, clientes, promociones y ajustes, mientras
 * WooCommerce no esté instalado. Vive en un archivo JSON fuera de /public (NUVEX_DATA_DIR,
 * por defecto ".data/") y nunca se envía al navegador completo: las páginas públicas reciben
 * versiones sin DPI (ver toPublicOrder). Cuando exista WooCommerce, estas funciones se
 * reemplazan por llamadas a wc/v3 sin cambiar las pantallas.
 */

export type EmailLog = { at: string; kind: string; subject: string };

export type StoredOrder = Order & {
  /** Secreto del enlace "Ver mi pedido". Nunca se muestra en el panel ni en registros. */
  token: string;
  origin: OrderOrigin;
  customer: { firstName: string; lastName: string };
  /** Correo de la cuenta a la que pertenece (si el cliente tiene o crea cuenta con ese correo). */
  accountEmail?: string;
  invoice?: { file: string; uploadedAt: string };
  paymentProof?: { file: string; uploadedAt: string };
  emails: EmailLog[];
};

type Data = { version: 1; settings: StoreSettings; promotions: Promotion[]; orders: StoredOrder[] };

export const dataDir = path.resolve(process.env.NUVEX_DATA_DIR || path.join(process.cwd(), ".data"));
const file = path.join(dataDir, "store.json");

const empty = (): Data => ({ version: 1, settings: { cfLimit: siteConfig.checkout.cfLimit }, promotions: [], orders: [] });

let cache: Data | null = null;
let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<Data> {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as Partial<Data>;
    cache = { ...empty(), ...parsed, settings: { ...empty().settings, ...parsed.settings } } as Data;
  } catch {
    cache = empty();
  }
  return cache;
}

async function persist(data: Data) {
  await mkdir(dataDir, { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data), "utf8");
  await rename(tmp, file);
}

/** Lecturas: copia segura del estado actual. */
export async function read<T>(fn: (d: Data) => T): Promise<T> {
  return structuredClone(fn(await load()));
}

/** Escrituras en serie (una a la vez) para no perder cambios simultáneos. */
export function mutate<T>(fn: (d: Data) => T): Promise<T> {
  const run = queue.then(async () => {
    const data = await load();
    const result = fn(data);
    await persist(data);
    return structuredClone(result);
  });
  queue = run.catch(() => undefined);
  return run;
}

export const newToken = () => randomBytes(24).toString("base64url");

export function tokenMatches(order: Pick<StoredOrder, "token">, candidate: string) {
  const a = Buffer.from(order.token);
  const b = Buffer.from(candidate);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/* ---------- Archivos (facturas, comprobantes, fotos del paquete) ---------- */

const FILE_TYPES: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function uploadError(f: File, allowed: string[]) {
  if (!allowed.includes(f.type)) return "Formato no permitido.";
  if (f.size > MAX_UPLOAD_BYTES) return "El archivo supera 5 MB.";
  return null;
}

export async function saveUpload(kind: "facturas" | "comprobantes" | "paquetes", f: File) {
  const dir = path.join(dataDir, kind);
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${FILE_TYPES[f.type] ?? "bin"}`;
  await writeFile(path.join(dir, name), Buffer.from(await f.arrayBuffer()));
  return `${kind}/${name}`;
}

export async function readUpload(rel: string) {
  // Solo rutas generadas por saveUpload: carpeta conocida + nombre sin separadores.
  if (!/^(facturas|comprobantes|paquetes)\/[\w.-]+$/.test(rel)) return null;
  try {
    return await readFile(path.join(dataDir, rel));
  } catch {
    return null;
  }
}

export function contentTypeFor(rel: string) {
  const ext = rel.split(".").pop();
  return Object.entries(FILE_TYPES).find(([, e]) => e === ext)?.[0] ?? "application/octet-stream";
}

/* ---------- Correos ---------- */

const subjects: Partial<Record<OrderStatus | "creado" | "factura", string>> = {
  creado: "Recibimos tu compra",
  confirmado: "Tu pago fue confirmado",
  rechazado: "No pudimos verificar tu pago",
  preparando: "Estamos preparando tu pedido",
  listo: "Tu pedido está listo",
  transporte: "Tu pedido espera transporte",
  enviado: "Tu pedido fue enviado",
  entregado: "Tu pedido fue entregado",
  factura: "Tu factura está lista",
};

/**
 * Registra el correo que corresponde a cada evento del pedido (siempre con el enlace "Ver mi pedido"
 * y nunca con el DPI). PENDIENTE: el envío real se conectará con el correo de WooCommerce o un
 * proveedor SMTP; mientras tanto solo queda en el historial del pedido.
 */
export function logEmail(order: StoredOrder, kind: keyof typeof subjects) {
  const subject = `${subjects[kind] ?? "Actualización de tu pedido"} · Compra #${order.id}`;
  order.emails = [...(order.emails ?? []), { at: new Date().toISOString(), kind, subject }];
}

/** Versión para el cliente: sin token, sin DPI y sin rutas internas de archivos. */
export function toPublicOrder(o: StoredOrder, baseUrl = ""): Order {
  const { token, invoice } = o;
  const viewUrl = `${baseUrl}/pedido/${encodeURIComponent(o.id)}?t=${token}`;
  return {
    id: o.id,
    createdAt: o.createdAt,
    status: o.status,
    history: o.history,
    lines: o.lines,
    subtotal: o.subtotal,
    shipping: o.shipping,
    discount: o.discount,
    coupon: o.coupon,
    promoDiscount: o.promoDiscount,
    promoLabel: o.promoLabel,
    total: o.total,
    email: o.email,
    customer: o.customer,
    origin: o.origin,
    shippingData: o.shippingData,
    payment: o.payment,
    rejectionReason: o.rejectionReason,
    demo: o.demo,
    billing: { name: o.billing.name, nit: o.billing.nit, dpi: "" },
    invoiceUrl: invoice ? `/api/pedidos/${encodeURIComponent(o.id)}/factura?t=${token}` : undefined,
    tracking: o.tracking ? { ...o.tracking, photo: o.tracking.photo ? `/api/pedidos/${encodeURIComponent(o.id)}/paquete?t=${token}` : undefined } : undefined,
    viewUrl,
  };
}

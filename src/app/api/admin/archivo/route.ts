import { getSession } from "@/lib/admin/session";
import { contentTypeFor, readUpload } from "@/lib/server/db";

/** Comprobantes, facturas y fotos de paquetes para el panel (solo con sesión de administrador). */
export async function GET(request: Request) {
  if (!(await getSession())) return new Response("No autorizado", { status: 401 });
  const rel = new URL(request.url).searchParams.get("f") ?? "";
  const data = await readUpload(rel);
  if (!data) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": contentTypeFor(rel), "Content-Disposition": "inline", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}

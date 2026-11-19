import { contentTypeFor, read, readUpload, tokenMatches } from "@/lib/server/db";

/** Factura (PDF) o foto del paquete de un pedido, solo con el enlace secreto "Ver mi pedido". */
export async function GET(request: Request, { params }: { params: Promise<{ id: string; archivo: string }> }) {
  const { id, archivo } = await params;
  const token = new URL(request.url).searchParams.get("t") ?? "";
  if (archivo !== "factura" && archivo !== "paquete") return new Response("No encontrado", { status: 404 });
  const rel = await read((d) => {
    const o = d.orders.find((x) => x.id === decodeURIComponent(id));
    if (!o || !token || !tokenMatches(o, token)) return null;
    return archivo === "factura" ? (o.invoice?.file ?? null) : (o.tracking?.photo ?? null);
  });
  const data = rel ? await readUpload(rel) : null;
  if (!rel || !data) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": contentTypeFor(rel),
      "Content-Disposition": archivo === "factura" ? `inline; filename="factura-${id}.pdf"` : "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}

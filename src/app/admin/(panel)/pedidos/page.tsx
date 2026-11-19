import type { Metadata } from "next";
import Link from "next/link";
import type { OrderOrigin } from "@/types/account";
import { Alert, inputClass } from "@/components/admin/fields";
import { PageHeader, StatusPill } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/session";
import { oneOf } from "@/lib/admin/validation";
import { formatDate, gtq } from "@/lib/format";
import { originLabel } from "@/lib/order-labels";
import { isPaid, statusMeta } from "@/lib/order-status";
import { listOrders } from "@/lib/server/admin-store";

export const metadata: Metadata = { title: "Pedidos" };

type Search = { q?: string; origen?: string };
const ORIGINS = ["", "web", "whatsapp", "tienda", "telefono"] as const;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const q = (params.q || "").trim().slice(0, 100);
  const origin = oneOf(params.origen || "", ORIGINS, "");
  const orders = await listOrders(q, (origin || undefined) as OrderOrigin | undefined);

  return (
    <>
      <PageHeader title="Pedidos" description={`${orders.length} pedido${orders.length === 1 ? "" : "s"} · sitio web y manuales`} action={{ href: "/admin/pedidos/nuevo", label: "Crear pedido manual" }} />
      <div className="grid gap-4">
        <Alert tone="info">Modo demostración: los pedidos se guardan en el servidor de la tienda (archivo de datos) hasta conectar WooCommerce. Los correos quedan registrados en cada pedido, pero aún no se envían.</Alert>
        <form role="search" className="flex flex-col gap-3 sm:flex-row" action="/admin/pedidos">
          <label htmlFor="q" className="sr-only">Buscar pedidos</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Número, nombre, correo, DPI o teléfono" className={inputClass} />
          <label htmlFor="origen" className="sr-only">Origen</label>
          <select id="origen" name="origen" defaultValue={origin} className={`${inputClass} sm:max-w-52`}>
            <option value="">Todos los orígenes</option>
            {(Object.keys(originLabel) as OrderOrigin[]).map((o) => (
              <option key={o} value={o}>
                {originLabel[o]}
              </option>
            ))}
          </select>
          <button type="submit" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-border bg-card px-5 text-sm font-medium hover:bg-surface">
            Filtrar
          </button>
        </form>

        {orders.length ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Listado de pedidos</caption>
              <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Pedido</th>
                  <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Cliente</th>
                  <th scope="col" className="hidden px-4 py-3 font-medium lg:table-cell">Origen</th>
                  <th scope="col" className="px-4 py-3 font-medium">Total</th>
                  <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-surface/60">
                    <td className="px-4 py-3">
                      <Link href={`/admin/pedidos/${encodeURIComponent(o.id)}`} className="font-semibold hover:text-primary-strong hover:underline">
                        #{o.id}
                      </Link>
                      <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                      <p className="truncate text-xs text-muted md:hidden">{o.shippingData.fullName}</p>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <p className="font-medium">{[o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(" ") || o.shippingData.fullName}</p>
                      <p className="text-xs text-muted">
                        {o.email} {o.accountEmail ? "· Con cuenta" : "· Sin cuenta"}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">{originLabel[o.origin]}</td>
                    <td className="px-4 py-3 font-semibold">{gtq(o.total)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <StatusPill tone={o.status === "rechazado" ? "danger" : isPaid(o.status) ? "success" : "neutral"}>{statusMeta[o.status].label}</StatusPill>
                        {isPaid(o.status) && !o.invoice && <StatusPill tone="info">Sin factura</StatusPill>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="font-semibold">{q || origin ? "Ningún pedido coincide con el filtro" : "Aún no hay pedidos"}</p>
            <p className="mt-1 text-sm text-muted">{q || origin ? "Prueba con otra búsqueda." : "Los pedidos del sitio y los manuales aparecerán aquí."}</p>
          </div>
        )}
      </div>
    </>
  );
}

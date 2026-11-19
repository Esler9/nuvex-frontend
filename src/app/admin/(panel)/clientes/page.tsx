import type { Metadata } from "next";
import Link from "next/link";
import { inputClass } from "@/components/admin/fields";
import { PageHeader, StatusPill } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/session";
import { formatDpi } from "@/lib/checkout";
import { formatDate, gtq } from "@/lib/format";
import { originLabel } from "@/lib/order-labels";
import { statusMeta } from "@/lib/order-status";
import { listCustomers } from "@/lib/server/admin-store";

export const metadata: Metadata = { title: "Clientes" };

/** Todos los compradores (con cuenta y sin cuenta), con su historial de pedidos. */
export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const q = ((await searchParams).q || "").trim().slice(0, 100);
  const customers = await listCustomers(q);

  return (
    <>
      <PageHeader title="Clientes" description={`${customers.length} cliente${customers.length === 1 ? "" : "s"}`} />
      <div className="grid gap-4">
        <form role="search" className="flex flex-col gap-3 sm:flex-row" action="/admin/clientes">
          <label htmlFor="q" className="sr-only">Buscar clientes</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Nombre, DPI, teléfono o correo" className={inputClass} />
          <button type="submit" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-border bg-card px-5 text-sm font-medium hover:bg-surface">
            Buscar
          </button>
        </form>

        {customers.length ? (
          <ul className="grid gap-3">
            {customers.map((c) => (
              <li key={c.email} className="rounded-xl border border-border bg-card">
                <details>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-sm text-muted">
                        {c.email} · Tel. {c.phone} · DPI {formatDpi(c.dpi)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <StatusPill tone={c.registered ? "info" : "neutral"}>{c.registered ? "Con cuenta" : "Sin cuenta"}</StatusPill>
                      <span className="text-muted">
                        {c.orders.length} pedido{c.orders.length === 1 ? "" : "s"} · {gtq(c.total)}
                      </span>
                    </div>
                  </summary>
                  <ul className="divide-y divide-border border-t border-border text-sm">
                    {c.orders.map((o) => (
                      <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                        <Link href={`/admin/pedidos/${encodeURIComponent(o.id)}`} className="font-medium hover:text-primary-strong hover:underline">
                          #{o.id}
                        </Link>
                        <span className="text-muted">
                          {formatDate(o.createdAt)} · {originLabel[o.origin]} · {statusMeta[o.status].label}
                        </span>
                        <span className="font-semibold">{gtq(o.total)}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="font-semibold">{q ? "Ningún cliente coincide con la búsqueda" : "Aún no hay clientes"}</p>
            <p className="mt-1 text-sm text-muted">{q ? "Prueba con otro dato." : "Cada comprador aparece aquí con su primer pedido."}</p>
          </div>
        )}
      </div>
    </>
  );
}

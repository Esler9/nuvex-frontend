import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/session";
import { formatDateTime, gtq } from "@/lib/format";
import { originLabel } from "@/lib/order-labels";
import { pendingInvoices } from "@/lib/server/admin-store";

export const metadata: Metadata = { title: "Facturas pendientes" };

/** Pedidos con pago confirmado y sin factura subida, del más antiguo al más reciente. */
export default async function PendingInvoicesPage() {
  await requireAdmin();
  const orders = await pendingInvoices();
  return (
    <>
      <PageHeader title="Facturas pendientes" description={orders.length ? `${orders.length} pedido${orders.length === 1 ? "" : "s"} con pago confirmado sin factura` : undefined} />
      {orders.length ? (
        <ol className="grid gap-3">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
              <div className="min-w-0">
                <Link href={`/admin/pedidos/${encodeURIComponent(o.id)}`} className="font-semibold hover:text-primary-strong hover:underline">
                  #{o.id}
                </Link>
                <p className="text-sm">
                  {o.billing.nit ? `NIT ${o.billing.nit}` : "Consumidor Final (CF)"} · {o.billing.name}
                </p>
                <p className="text-xs text-muted">
                  Pago confirmado {formatDateTime(o.history.confirmado ?? o.createdAt)} · {originLabel[o.origin]}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{gtq(o.total)}</span>
                <Link href={`/admin/pedidos/${encodeURIComponent(o.id)}#factura-t`} className="inline-flex min-h-10 items-center rounded-lg border border-primary px-4 text-sm font-semibold text-primary-strong hover:bg-primary-soft">
                  Facturar
                </Link>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <p className="font-semibold">No hay facturas pendientes</p>
          <p className="mt-1 text-sm text-muted">Los pedidos con pago confirmado aparecerán aquí hasta que subas su factura.</p>
        </div>
      )}
    </>
  );
}

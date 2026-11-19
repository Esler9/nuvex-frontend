"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, ShoppingBag } from "lucide-react";
import type { Order } from "@/types/account";
import { EmptyBlock } from "@/components/account/account-shell";
import { ProductThumb, StatusPill } from "@/components/account/status-ui";
import { ui } from "@/components/ui/styles";
import { forward } from "@/components/page-transition";
import { formatDate, gtq } from "@/lib/format";
import { isInProgress } from "@/lib/order-status";

const filters = [
  { id: "todas", label: "Todas", test: () => true },
  { id: "proceso", label: "En proceso", test: (o: Order) => isInProgress(o.status) },
  { id: "entregadas", label: "Entregadas", test: (o: Order) => o.status === "entregado" },
] as const;

export function OrdersList({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("todas");

  if (!orders.length) {
    return (
      <EmptyBlock
        icon={<ShoppingBag aria-hidden className="size-12 text-primary" strokeWidth={1.5} />}
        title="Aún no tienes compras"
        action={
          <Link href="/productos" className={ui.btnOutline}>
            Ver productos
          </Link>
        }
      />
    );
  }

  const active = filters.find((f) => f.id === filter) ?? filters[0];
  const list = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).filter(active.test);

  return (
    <>
      <div role="group" aria-label="Filtrar compras" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors ${filter === f.id ? "border-primary bg-primary text-white" : "border-border bg-card text-foreground hover:bg-surface"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="mt-6 rounded-xl border border-border bg-card p-6 text-center text-sm text-muted">No hay compras en este filtro.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card shadow-card">
          {list.map((o) => {
            const units = o.lines.reduce((s, l) => s + l.quantity, 0);
            return (
              <li key={o.id} className="relative">
                <div className="flex items-center gap-3 p-4">
                  <ProductThumb src={o.lines[0]?.image} size="size-14" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">
                      <Link href={`/mi-cuenta/compras/${o.id}`} transitionTypes={forward} className="after:absolute after:inset-0 after:content-['']">
                        Compra #{o.id}
                      </Link>
                    </p>
                    <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                    <div className="mt-1.5">
                      <StatusPill status={o.status} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{gtq(o.total)}</p>
                    <p className="text-xs text-muted">{units === 1 ? "1 producto" : `${units} productos`}</p>
                  </div>
                  <ChevronRight aria-hidden className="size-4 shrink-0 text-muted" />
                </div>
                {o.status === "rechazado" && (
                  <Link href={`/mi-cuenta/compras/${o.id}#comprobante`} className="relative z-10 -mt-2 mb-3 ml-[4.75rem] inline-flex min-h-11 items-center text-sm font-semibold text-danger underline underline-offset-2">
                    Subir otro comprobante
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

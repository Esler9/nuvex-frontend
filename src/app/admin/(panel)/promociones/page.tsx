import type { Metadata } from "next";
import Link from "next/link";
import type { Promotion } from "@/types/promotions";
import { deletePromotionAction, togglePromotionAction } from "@/app/admin/order-actions";
import { Alert, ConfirmButton } from "@/components/admin/fields";
import { PageHeader, StatusPill } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/session";
import { formatDate } from "@/lib/format";
import { isPromotionLive, promoBadge } from "@/lib/promotions";
import { listPromotions } from "@/lib/server/admin-store";

export const metadata: Metadata = { title: "Promociones" };

function scopeText(p: Promotion) {
  if (p.scope === "all") return "Toda la tienda";
  if (p.scope === "category") return `Categoría: ${p.categorySlugs.join(", ")}`;
  return `${p.productIds.length} producto${p.productIds.length === 1 ? "" : "s"}`;
}

function stateOf(p: Promotion) {
  if (!p.active) return { label: "Desactivada", tone: "neutral" as const };
  if (isPromotionLive(p)) return { label: "Activa", tone: "success" as const };
  return p.startsAt && Date.parse(p.startsAt) > Date.now() ? { label: "Programada", tone: "info" as const } : { label: "Terminada", tone: "neutral" as const };
}

export default async function PromotionsPage({ searchParams }: { searchParams: Promise<{ guardado?: string; eliminado?: string }> }) {
  await requireAdmin();
  const [promotions, sp] = await Promise.all([listPromotions(), searchParams]);
  return (
    <>
      <PageHeader title="Promociones" description="Tú decides si hay promoción, cuál y cuándo. Sin promociones activas, la tienda no muestra nada." action={{ href: "/admin/promociones/nueva", label: "Nueva promoción" }} />
      <div className="grid gap-4">
        {sp.guardado && <Alert tone="success">Promoción guardada. La tienda se actualizó.</Alert>}
        {sp.eliminado && <Alert tone="success">Promoción eliminada.</Alert>}
        {promotions.length ? (
          <ul className="grid gap-3">
            {promotions.map((p) => {
              const state = stateOf(p);
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/promociones/${p.id}`} className="font-semibold hover:text-primary-strong hover:underline">
                        {p.name}
                      </Link>
                      <StatusPill tone={state.tone}>{state.label}</StatusPill>
                    </div>
                    <p className="text-sm">
                      {promoBadge(p)} de descuento · {scopeText(p)} · {p.registeredOnly ? "Solo clientes registrados" : "Todos los clientes"}
                    </p>
                    <p className="text-xs text-muted">
                      {p.startsAt ? `Desde ${formatDate(p.startsAt)}` : "Sin fecha de inicio"} · {p.endsAt ? `hasta ${formatDate(p.endsAt)}` : "sin fecha de fin"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={togglePromotionAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" role="switch" aria-checked={p.active} aria-label={`${p.active ? "Desactivar" : "Activar"} ${p.name}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface">
                        <span aria-hidden className={`relative h-5 w-9 rounded-full transition-colors ${p.active ? "bg-primary-strong" : "bg-pending"}`}>
                          <span className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${p.active ? "left-[18px]" : "left-0.5"}`} />
                        </span>
                        {p.active ? "Activada" : "Desactivada"}
                      </button>
                    </form>
                    <form action={deletePromotionAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmButton message={`¿Eliminar la promoción "${p.name}"?`}>Eliminar</ConfirmButton>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="font-semibold">No hay promociones</p>
            <p className="mt-1 text-sm text-muted">Crea una para ofrecer un descuento, por ejemplo 5% solo para clientes registrados.</p>
          </div>
        )}
      </div>
    </>
  );
}

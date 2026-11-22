"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageSquareText, Pencil, Trash2 } from "lucide-react";
import type { AccountData, MyReview } from "@/types/account";
import { useStore } from "@/components/store/store-provider";
import { EmptyBlock } from "@/components/account/account-shell";
import { ProductThumb } from "@/components/account/status-ui";
import { ReviewDialog, type ReviewTarget } from "@/components/account/review-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Stars } from "@/components/stars";
import { ui } from "@/components/ui/styles";
import { accountStore, pendingReviews } from "@/lib/account-store";
import { formatDate } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";

export function ReviewsView({ account }: { account: AccountData }) {
  const { notify } = useStore();
  const [target, setTarget] = useState<ReviewTarget | null>(null);
  const [toDelete, setToDelete] = useState<MyReview | null>(null);
  const pending = pendingReviews(account);
  const points = siteConfig.points.enabled ? siteConfig.points.perReview : 0;

  function edit(r: MyReview) {
    const line = account.orders.find((o) => o.id === r.orderId)?.lines.find((l) => l.productId === r.productId) ?? { productId: r.productId, slug: r.slug, name: r.productName, image: r.image, unitPrice: 0, quantity: 1 };
    setTarget({ orderId: r.orderId, line, existing: r });
  }

  return (
    <div className="space-y-5">
      {pending.length > 0 && (
        <section aria-labelledby="sin-calificar" className={ui.card}>
          <h2 id="sin-calificar" className={ui.eyebrow}>
            Compras entregadas sin calificar
          </h2>
          <ul className="mt-3 divide-y divide-border">
            {pending.map(({ orderId, line }) => (
              <li key={`${orderId}-${line.productId}`} className="flex flex-wrap items-center gap-3 py-3">
                <ProductThumb src={line.image} name={line.name} size="size-12" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="line-clamp-2 font-semibold">{line.name}</p>
                  <p className="text-xs text-muted">Compra #{orderId}</p>
                </div>
                <button type="button" onClick={() => setTarget({ orderId, line })} className={`${ui.btnOutline} min-h-11 w-full px-4 text-sm sm:w-auto`}>
                  {points ? `Calificar y ganar ${points} pts` : "Calificar"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {account.reviews.length === 0 ? (
        <EmptyBlock icon={<MessageSquareText aria-hidden className="size-12 text-primary" strokeWidth={1.5} />} title="Aún no has dejado opiniones" text="Cuando recibas una compra podrás calificar cada producto." />
      ) : (
        <ul className="space-y-3">
          {account.reviews.map((r) => (
            <li key={r.id} className={ui.card}>
              <div className="flex gap-3">
                <ProductThumb src={r.image} name={r.productName} size="size-14" />
                <div className="min-w-0 flex-1">
                  <Link href={`/productos/${encodeURIComponent(r.slug)}`} className="line-clamp-2 text-sm font-semibold hover:text-primary-strong">
                    {r.productName}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="sr-only">{r.rating} de 5 estrellas</span>
                    <span className="text-xs text-muted">{formatDate(r.date)}</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm">{r.comment}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => edit(r)} className={ui.btnGhost}>
                  <Pencil aria-hidden className="size-4" /> Editar
                </button>
                <button type="button" onClick={() => setToDelete(r)} className={`${ui.btnGhost} hover:text-danger`}>
                  <Trash2 aria-hidden className="size-4" /> Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ReviewDialog target={target} onClose={() => setTarget(null)} />
      <ConfirmDialog
        open={!!toDelete}
        title="¿Borrar tu opinión?"
        message={toDelete?.pointsAwarded ? `Se descontarán los ${toDelete.pointsAwarded} puntos que ganaste con esta opinión.` : undefined}
        confirmLabel="Borrar"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) accountStore.deleteReview(toDelete.id);
          setToDelete(null);
          notify("Opinión borrada");
        }}
      />
    </div>
  );
}

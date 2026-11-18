"use client";

import { useState } from "react";
import { Gift, ShoppingBag, Star, Ticket } from "lucide-react";
import type { AccountData, Coupon } from "@/types/account";
import { ProductThumb } from "@/components/account/status-ui";
import { ReviewDialog, type ReviewTarget } from "@/components/account/review-dialog";
import { CopyButton } from "@/components/ui/copy-button";
import { Sheet } from "@/components/ui/sheet";
import { ui } from "@/components/ui/styles";
import { accountStore, pendingReviews, pointsBalance } from "@/lib/account-store";
import { couponState, pointsValue } from "@/lib/checkout";
import { formatDate, gtq } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";

const couponTone = { disponible: "bg-success/10 text-success", usado: "bg-surface text-muted", vencido: "bg-surface text-muted" };
const couponLabel = { disponible: "Disponible", usado: "Usado", vencido: "Vencido" };

export function PointsView({ account }: { account: AccountData }) {
  const cfg = siteConfig.points;
  const balance = pointsBalance(account);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [review, setReview] = useState<ReviewTarget | null>(null);
  const pending = pendingReviews(account);
  const history = [...account.points].sort((a, b) => b.date.localeCompare(a.date));

  if (!cfg.enabled) {
    return <p className={`${ui.card} text-sm text-muted`}>El programa Puntos NUVEX no está activo por ahora.</p>;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl bg-primary p-5 text-white shadow-card sm:p-6">
        <p className="text-sm font-semibold text-white">Tus Puntos NUVEX</p>
        <p className="mt-1 text-4xl font-black">{balance} pts</p>
        <p className="mt-1 text-sm text-white">Equivale a {gtq(pointsValue(balance))} de descuento</p>
        <button type="button" onClick={() => setRedeemOpen(true)} disabled={balance < cfg.minRedeem} className={`${ui.btnPrimary} mt-4 w-full sm:w-auto`}>
          Canjear mis puntos
        </button>
        {balance < cfg.minRedeem && <p className="mt-2 text-xs text-white">Necesitas al menos {cfg.minRedeem} puntos para canjear.</p>}
      </section>

      <section aria-labelledby="ganar-titulo" className={ui.card}>
        <h2 id="ganar-titulo" className={ui.eyebrow}>
          ¿Cómo ganar puntos?
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          <li className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-strong">
              <ShoppingBag aria-hidden className="size-5" />
            </span>
            <p className="text-sm">
              <strong>Comprando:</strong> {cfg.earn.points === 1 ? "1 punto" : `${cfg.earn.points} puntos`} por cada {gtq(cfg.earn.perAmount)} pagados, cuando tu pedido se entrega.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-strong">
              <Star aria-hidden className="size-5" />
            </span>
            <p className="text-sm">
              <strong>Calificando:</strong> {cfg.perReview} puntos por cada opinión de un producto que compraste.
            </p>
          </li>
        </ul>
      </section>

      {pending.length > 0 && (
        <section aria-labelledby="calificar-titulo" className={ui.card}>
          <h2 id="calificar-titulo" className={ui.eyebrow}>
            Productos por calificar
          </h2>
          <ul className="mt-3 divide-y divide-border">
            {pending.map(({ orderId, line }) => (
              <li key={`${orderId}-${line.productId}`} className="flex flex-wrap items-center gap-3 py-3">
                <ProductThumb src={line.image} size="size-12" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="line-clamp-2 font-semibold">{line.name}</p>
                  <p className="text-xs text-muted">Compra #{orderId}</p>
                </div>
                <button type="button" onClick={() => setReview({ orderId, line })} className={`${ui.btnOutline} min-h-11 w-full px-4 text-sm sm:w-auto`}>
                  Calificar y ganar {cfg.perReview} pts
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="cupones-titulo" className={ui.card}>
        <h2 id="cupones-titulo" className={ui.eyebrow}>
          Mis cupones
        </h2>
        {account.coupons.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Aún no tienes cupones. Canjea tus puntos para obtener uno.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {account.coupons.map((c) => {
              const state = couponState(c);
              return (
                <li key={c.code} className={`flex flex-wrap items-center gap-3 rounded-xl border border-dashed p-3 ${state === "disponible" ? "border-primary" : "border-border opacity-80"}`}>
                  <Ticket aria-hidden className={`size-5 shrink-0 ${state === "disponible" ? "text-primary-strong" : "text-muted"}`} />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-mono font-bold tracking-wide">{c.code}</p>
                    <p className="text-xs text-muted">
                      {gtq(c.value)} · {state === "usado" ? `Usado el ${formatDate(c.usedAt!)}` : `Vence el ${formatDate(c.expiresAt)}`}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${couponTone[state]}`}>{couponLabel[state]}</span>
                  {state === "disponible" && <CopyButton text={c.code} notice="Cupón copiado" />}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="historial-titulo" className={ui.card}>
        <h2 id="historial-titulo" className={ui.eyebrow}>
          Historial
        </h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Aún no tienes movimientos de puntos.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{h.reason}</p>
                  <p className="text-xs text-muted">{formatDate(h.date)}</p>
                </div>
                <p className={`shrink-0 font-bold ${h.points > 0 ? "text-success" : "text-muted"}`}>
                  {h.points > 0 ? "+" : "−"}
                  {Math.abs(h.points)} pts
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <RedeemDialog open={redeemOpen} balance={balance} onClose={() => setRedeemOpen(false)} />
      <ReviewDialog target={review} onClose={() => setReview(null)} />
    </div>
  );
}

function RedeemDialog({ open, balance, onClose }: { open: boolean; balance: number; onClose: () => void }) {
  const cfg = siteConfig.points;
  const [selected, setSelected] = useState<number | null>(null);
  const [created, setCreated] = useState<Coupon | null>(null);

  function close() {
    setSelected(null);
    setCreated(null);
    onClose();
  }

  return (
    <Sheet open={open} onClose={close} title={created ? "¡Listo! Tu cupón" : "Canjear mis puntos"} side="center">
      {created ? (
        <div className="text-center">
          <Gift aria-hidden className="mx-auto size-10 text-primary" />
          <p className="mt-3 font-mono text-2xl font-black tracking-wider">{created.code}</p>
          <p className="mt-1 text-sm">
            Vale {gtq(created.value)} · Vence el {formatDate(created.expiresAt)}
          </p>
          <CopyButton text={created.code} notice="Cupón copiado" className="mt-4" />
          <p className="mt-4 text-xs text-muted">Un solo uso y solo en tu cuenta. Aplícalo en el paso 1 de la orden de compra.</p>
          <button type="button" onClick={close} className={`${ui.btnOutline} mt-5 w-full`}>
            Cerrar
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted">
            Tienes <strong className="text-foreground">{balance} pts</strong>. Elige cuántos canjear:
          </p>
          <div role="radiogroup" aria-label="Puntos a canjear" className="mt-3 grid gap-2">
            {cfg.redeemBlocks.map((pts) => {
              const disabled = pts > balance || pts < cfg.minRedeem;
              return (
                <label key={pts} className={`flex min-h-12 items-center justify-between rounded-xl border px-4 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${disabled ? "cursor-not-allowed border-border opacity-50" : "cursor-pointer"} ${selected === pts ? "border-primary bg-primary-soft" : "border-border"}`}>
                  <input type="radio" name="redeem" value={pts} disabled={disabled} checked={selected === pts} onChange={() => setSelected(pts)} className="sr-only" />
                  <span className="font-semibold">{pts} pts</span>
                  <span className="font-bold text-success">{gtq(pointsValue(pts))} de descuento</span>
                </label>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted">
            Mínimo {cfg.minRedeem} puntos. El cupón vale {cfg.couponDays} días.
          </p>
          <button
            type="button"
            disabled={!selected}
            onClick={() => {
              if (!selected) return;
              setCreated(accountStore.redeem(selected));
            }}
            className={`${ui.btnPrimary} mt-4 w-full`}
          >
            Canjear
          </button>
        </div>
      )}
    </Sheet>
  );
}

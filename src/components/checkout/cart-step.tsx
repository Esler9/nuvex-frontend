"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Minus, Plus, ShoppingBag, Ticket, Trash2, Truck } from "lucide-react";
import type { Coupon } from "@/types/account";
import type { CartLine } from "@/types/content";
import { useStore } from "@/components/store/store-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProductThumb } from "@/components/account/status-ui";
import { OrderSummary } from "@/components/checkout/order-summary";
import { ComplementaryRail } from "@/components/checkout/complementary-rail";
import { ui } from "@/components/ui/styles";
import { checkCoupon, useAccount } from "@/lib/account-store";
import { couponState, orderTotals } from "@/lib/checkout";
import { gtq } from "@/lib/format";

type Props = { coupon: Coupon | null; onCoupon: (c: Coupon | null) => void; onContinue: () => void };

export function CartStep({ coupon, onCoupon, onContinue }: Props) {
  const { lines, subtotal, setQuantity, removeItem } = useStore();
  const account = useAccount();
  const [toRemove, setToRemove] = useState<CartLine | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  if (!lines.length) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <ShoppingBag aria-hidden className="size-12 text-primary" />
        <p className="mt-4 text-lg font-semibold">Tu carrito está vacío</p>
        <p className="mt-1 text-sm text-muted">Agrega accesorios para verlos aquí.</p>
        <Link href="/productos" className={`${ui.btnOutline} mt-6`}>
          Ver productos
        </Link>
      </div>
    );
  }

  const t = orderTotals(subtotal, coupon?.value ?? 0);
  const available = (account?.coupons ?? []).filter((c) => couponState(c) === "disponible" && c.code !== coupon?.code);

  function apply(raw: string) {
    const result = checkCoupon(raw, account);
    if (!result.ok) return setError(result.error);
    setError("");
    setCode("");
    onCoupon(result.coupon);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div>
        <ul className={`${ui.card} divide-y divide-border py-0 sm:py-0`}>
          {lines.map((line) => (
            <li key={line.id} className="flex gap-3 py-4">
              <ProductThumb src={line.image} size="size-20" />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/productos/${encodeURIComponent(line.slug)}`} className="line-clamp-2 text-sm font-semibold hover:text-primary-strong">
                      {line.name}
                    </Link>
                    {line.detail && <p className="mt-0.5 text-sm text-muted">{line.detail}</p>}
                  </div>
                  <button type="button" onClick={() => setToRemove(line)} aria-label={`Quitar ${line.name} del carrito`} className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-surface hover:text-danger">
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full border border-border" role="group" aria-label={`Cantidad de ${line.name}`}>
                    <button type="button" onClick={() => (line.quantity > 1 ? setQuantity(line.id, line.quantity - 1) : setToRemove(line))} aria-label="Quitar uno" className="grid size-11 place-items-center rounded-full hover:bg-surface">
                      <Minus aria-hidden className="size-4" />
                    </button>
                    <span className="min-w-6 text-center text-sm font-semibold" aria-live="polite">
                      {line.quantity}
                    </span>
                    <button type="button" onClick={() => setQuantity(line.id, line.quantity + 1)} aria-label="Agregar uno" className="grid size-11 place-items-center rounded-full hover:bg-surface">
                      <Plus aria-hidden className="size-4" />
                    </button>
                  </div>
                  <p className="font-bold">{gtq(line.unitPrice * line.quantity)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <section aria-labelledby="cupon-titulo" className={ui.card}>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              apply(code);
            }}
          >
            <label id="cupon-titulo" htmlFor="coupon" className="text-sm font-semibold">
              Cupón de descuento
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="coupon"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="NUVEX-XXXX"
                autoComplete="off"
                autoCapitalize="characters"
                aria-invalid={!!error}
                aria-describedby={error ? "coupon-error" : undefined}
                disabled={!!coupon}
                className={`${ui.input} mt-0 uppercase disabled:opacity-60`}
              />
              <button type="submit" disabled={!!coupon} className={`${ui.btnOutline} px-4`}>
                Aplicar
              </button>
            </div>
            {error && (
              <p id="coupon-error" className="mt-1.5 text-sm font-medium text-danger">
                {error}
              </p>
            )}
            {coupon && <p className="mt-1.5 text-xs text-muted">Solo se puede usar un cupón por compra.</p>}
          </form>
          {!coupon && available.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted">Tus cupones disponibles:</p>
              <ul className="mt-1.5 flex flex-wrap gap-2">
                {available.map((c) => (
                  <li key={c.code}>
                    <button type="button" onClick={() => apply(c.code)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-dashed border-primary px-3 text-sm font-semibold text-primary-strong hover:bg-primary-soft">
                      <Ticket aria-hidden className="size-4" />
                      {c.code} · {gtq(c.value)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section aria-label="Resumen de la compra" className={ui.card}>
          <OrderSummary subtotal={t.subtotal} shipping={t.shipping} freeShipping={t.freeShipping} discount={t.discount} coupon={coupon?.code} total={t.total} onRemoveCoupon={() => onCoupon(null)} />
          {!t.freeShipping && (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-primary-soft p-3 text-sm">
              <Truck aria-hidden className="size-4 shrink-0 text-primary-strong" />
              <span>
                Agrega <strong>{gtq(t.missingForFree)}</strong> más y tu envío es gratis
              </span>
            </p>
          )}
          <button type="button" onClick={onContinue} className={`${ui.btnPrimary} mt-4 w-full`}>
            Continuar
          </button>
        </section>
      </div>

      <div className="lg:col-span-2">
        <ComplementaryRail ids={lines.map((l) => l.id)} />
      </div>

      <ConfirmDialog
        open={!!toRemove}
        title="¿Quitar este producto del carrito?"
        message={toRemove?.name}
        confirmLabel="Quitar"
        onCancel={() => setToRemove(null)}
        onConfirm={() => {
          if (toRemove) removeItem(toRemove.id);
          setToRemove(null);
        }}
      />
    </div>
  );
}

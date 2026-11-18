import type { ReactNode } from "react";
import { X } from "lucide-react";
import { gtq } from "@/lib/format";

type Props = {
  subtotal: number;
  shipping: number;
  freeShipping: boolean;
  discount: number;
  coupon?: string;
  total: number;
  onRemoveCoupon?: () => void;
  /** Etiqueta junto al total (p. ej. "Pagado"). */
  totalBadge?: ReactNode;
};

/** Resumen de montos: subtotal, envío, cupón y total. */
export function OrderSummary({ subtotal, shipping, freeShipping, discount, coupon, total, onRemoveCoupon, totalBadge }: Props) {
  return (
    <dl className="space-y-2.5 text-sm">
      <div className="flex justify-between gap-3">
        <dt className="text-muted">Subtotal</dt>
        <dd className="font-semibold">{gtq(subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-muted">Envío</dt>
        <dd className={freeShipping ? "font-semibold text-success" : "font-semibold"}>{freeShipping ? "Gratis" : gtq(shipping)}</dd>
      </div>
      {coupon && discount > 0 && (
        <div className="flex items-center justify-between gap-3 text-success">
          <dt className="flex items-center gap-1 font-medium">
            Cupón {coupon}
            {onRemoveCoupon && (
              <button type="button" onClick={onRemoveCoupon} aria-label={`Quitar cupón ${coupon}`} className="-my-2 grid size-9 place-items-center rounded-full text-muted hover:bg-surface hover:text-foreground">
                <X aria-hidden className="size-4" />
              </button>
            )}
          </dt>
          <dd className="font-semibold">−{gtq(discount)}</dd>
        </div>
      )}
      <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
        <dt className="text-base font-semibold">Total</dt>
        <dd className="flex flex-col items-end gap-1">
          <span className="text-2xl font-black">{gtq(total)}</span>
          {totalBadge}
        </dd>
      </div>
    </dl>
  );
}

"use client";

import type { Product } from "@/types/content";
import { useStore } from "@/components/store/store-provider";
import { formatMoney, money } from "@/lib/format";
import { regularPriceLabel } from "@/lib/product-meta";
import { promoBadge, promoView } from "@/lib/promotions";

type Variant = "card" | "detail" | "bar" | "compact";

/** Precio del producto con la promoción vigente que le corresponde al cliente (si hay). */
export function usePromoPrice(product: Product, parentId?: number) {
  const { promotions, customer } = useStore();
  const unit = product.prices ? Number(product.prices.price) : 0;
  const view = promoView(promotions, { ids: [product.id, ...(parentId ? [parentId] : [])], categories: product.categories?.map((c) => c.slug) ?? [] }, unit, Boolean(customer));
  const fmt = (cents: number) => formatMoney(cents, product.prices?.currency_minor_unit ?? 2, product.prices?.currency_code || "GTQ");
  return { ...view, fmt, unit };
}

export function OfferTag({ label, className = "" }: { label: string; className?: string }) {
  return <span className={`inline-flex items-center rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold leading-4 text-primary-strong ${className}`}>Oferta especial {label}</span>;
}

export function PromoPrice({ product, parentId, variant = "card", prefix = "" }: { product: Product; parentId?: number; variant?: Variant; prefix?: string }) {
  const { openAccount } = useStore();
  const { applied, loginHint, fmt, unit } = usePromoPrice(product, parentId);
  const regular = regularPriceLabel(product);
  const priceClass = { card: "text-lg font-bold leading-6", detail: "text-3xl font-black", bar: "text-xl font-black leading-tight", compact: "text-sm font-bold" }[variant];
  const strikeClass = variant === "detail" ? "text-base text-muted" : "text-xs text-muted";
  const hintClass = "text-xs font-medium text-primary-strong";

  if (applied) {
    return (
      <div className={variant === "card" ? "flex flex-col gap-1" : ""}>
        <p className={`flex flex-wrap items-baseline gap-x-2 ${variant === "detail" ? "gap-x-3" : ""}`}>
          <span className={`${priceClass} text-foreground`}>
            {prefix}
            {fmt(applied.final)}
          </span>
          <s className={strikeClass}>
            <span className="sr-only">Precio anterior: </span>
            {fmt(unit)}
          </s>
        </p>
        {variant !== "bar" && <OfferTag label={promoBadge(applied.promo)} className={variant === "detail" ? "mt-1.5" : ""} />}
      </div>
    );
  }

  const hint = loginHint ? `Inicia sesión para obtener ${promoBadge(loginHint)} de descuento` : null;
  return (
    <div>
      <p className={`flex flex-wrap items-baseline ${variant === "card" ? "justify-between gap-2" : variant === "detail" ? "gap-x-3" : "gap-x-2"}`}>
        <span className={`${priceClass} text-foreground`}>
          {prefix}
          {money(product)}
        </span>
        {regular && (
          <s className={strikeClass}>
            <span className="sr-only">Precio anterior: </span>
            {regular}
          </s>
        )}
      </p>
      {hint &&
        (variant === "detail" ? (
          <button type="button" onClick={() => openAccount("login")} className={`${hintClass} mt-1 underline-offset-2 hover:underline`}>
            {hint}
          </button>
        ) : (
          variant !== "bar" && <p className={`${hintClass} mt-0.5`}>{hint}</p>
        ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { ProductImagePlaceholder, placeholderBg } from "@/components/product-image-placeholder";
import { Sheet } from "@/components/ui/sheet";
import { useStore } from "@/components/store/store-provider";
import { formatMoney } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";

export function CartDrawer() {
  const { panel, closePanel, lines, subtotal, count, setQuantity, removeItem } = useStore();
  const close = () => closePanel("cart");
  const minorUnit = lines[0]?.minorUnit ?? 2;
  const currency = lines[0]?.currency ?? "GTQ";
  const fmt = (value: number) => formatMoney(value, minorUnit, currency);

  const threshold = siteConfig.freeShippingThreshold;
  const remaining = Math.max(threshold - subtotal, 0);
  const progress = Math.min((subtotal / threshold) * 100, 100);

  const footer = lines.length ? (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-base">
        <span className="text-muted">Subtotal</span>
        <span className="text-lg font-bold">{fmt(subtotal)}</span>
      </div>
      <Link href="/orden-de-compra" onClick={close} className="flex min-h-12 w-full items-center justify-center rounded-lg bg-accent px-6 font-bold text-accent-foreground transition-colors hover:bg-accent-strong">
        Proceder al pago
      </Link>
      <p className="text-center text-xs text-muted">Paga con depósito o transferencia bancaria. Precios y existencias se confirman al finalizar.</p>
    </div>
  ) : undefined;

  return (
    <Sheet open={panel === "cart"} onClose={close} title={`Tu carrito (${count})`} side="right" footer={footer}>
      {lines.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center py-10 text-center">
          <ShoppingBag aria-hidden className="size-12 text-primary" />
          <p className="mt-4 text-lg font-semibold">Tu carrito está vacío</p>
          <p className="mt-1 text-sm text-muted">Agrega accesorios para verlos aquí.</p>
          <Link href="/productos" onClick={close} className="mt-6 inline-flex min-h-12 items-center rounded-lg border border-primary px-6 font-semibold text-primary-strong transition-colors hover:bg-primary-soft">
            Ver productos
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-5 rounded-xl bg-primary-soft p-4" role="status">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Truck aria-hidden className="size-4 shrink-0 text-primary-strong" />
              {remaining > 0 ? (
                <span>
                  Agrega <strong>{fmt(remaining)}</strong> más y tu envío es gratis
                </span>
              ) : (
                <span className="font-semibold text-success">¡Tu envío es gratis!</span>
              )}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-card" aria-hidden>
              <div className={`h-full rounded-full transition-[width] ${remaining > 0 ? "bg-primary" : "bg-success"}`} style={{ width: `${progress}%` }} />
            </div>
          </div>

          <ul className="divide-y divide-border">
            {lines.map((line) => (
              <li key={line.id} className="flex gap-3 py-4">
                <div className={`grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl ${line.image ? "bg-surface" : placeholderBg(line.name, line.categories)}`}>
                  {line.image ? (
                    <img src={line.image} alt="" width={80} height={80} loading="lazy" className="size-full object-contain p-1.5" />
                  ) : (
                    <ProductImagePlaceholder name={line.name} categories={line.categories} iconClassName="size-8" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="line-clamp-2 text-sm font-semibold">{line.name}</p>
                  {line.detail && <p className="text-xs text-muted">{line.detail}</p>}
                  <p className="mt-0.5 text-sm text-muted">{fmt(line.unitPrice)} c/u</p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-full border border-border" role="group" aria-label={`Cantidad de ${line.name}`}>
                      <button type="button" onClick={() => setQuantity(line.id, line.quantity - 1)} aria-label="Quitar uno" className="grid size-11 place-items-center rounded-full hover:bg-surface">
                        <Minus aria-hidden className="size-4" />
                      </button>
                      <span className="min-w-6 text-center text-sm font-semibold" aria-live="polite">
                        {line.quantity}
                      </span>
                      <button type="button" onClick={() => setQuantity(line.id, line.quantity + 1)} aria-label="Agregar uno" className="grid size-11 place-items-center rounded-full hover:bg-surface">
                        <Plus aria-hidden className="size-4" />
                      </button>
                    </div>
                    <button type="button" onClick={() => removeItem(line.id)} aria-label={`Eliminar ${line.name}`} className="grid size-11 place-items-center rounded-full text-muted hover:bg-surface hover:text-accent-text">
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  );
}

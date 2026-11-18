"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Bell, Check, Landmark, ShoppingCart, Truck } from "lucide-react";
import type { CardVariant, Product, ProductOption, ProductOptions } from "@/types/content";
import { useStore } from "@/components/store/store-provider";
import { FavoriteButton } from "@/components/favorite-button";
import { ProductBadge } from "@/components/product-badge";
import { Stars } from "@/components/stars";
import { WhatsAppIcon } from "@/components/icons/brand-icons";
import { MediaGallery } from "@/components/product-detail/media-gallery";
import { ShareButton } from "@/components/product-detail/share-button";
import { OptionPicker } from "@/components/product-detail/option-picker";
import { formatMoney, money } from "@/lib/format";
import { brandName, cashOnDeliveryAvailable, priceInCents, ratingInfo, regularPriceLabel, stockInfo } from "@/lib/product-meta";
import { siteConfig, whatsappLink } from "@/lib/site-config";

type Props = {
  product: Product;
  options: ProductOptions;
  /** 1 = estilo blanco · 2 = estilo gris (según la categoría). */
  style: CardVariant;
  video: string | null;
  delivery: string;
  children?: ReactNode;
};

/** Combina el producto con la variación elegida (precio, existencia, imágenes y SKU propios). */
function withOption(product: Product, option: ProductOption | null): Product {
  if (!option) return product;
  const v = option.product;
  return {
    ...product,
    id: option.id,
    prices: v.prices ?? product.prices,
    on_sale: v.on_sale,
    images: v.images?.length ? v.images : product.images,
    sku: v.sku || product.sku,
    is_in_stock: v.is_in_stock,
    is_purchasable: v.is_purchasable ?? product.is_purchasable,
    stock_availability: v.stock_availability,
    low_stock_remaining: v.low_stock_remaining,
  };
}

const stockTone = { ok: "text-success", low: "text-accent-text", out: "text-muted" };

export function ProductView({ product, options, style, video, delivery, children }: Props) {
  const { addItem, subtotal } = useStore();
  const [selectedId, setSelectedId] = useState<number | null>(options?.defaultId ?? null);
  const [toast, setToast] = useState(false);

  const option = options?.items.find((i) => i.id === selectedId) ?? null;
  const view = withOption(product, option);
  const displayName = option ? `${product.name} · ${option.label}` : product.name;
  const sku = view.sku;
  const stock = stockInfo(view);
  const before = regularPriceLabel(view);
  const rating = ratingInfo(product);
  const brand = brandName(product);
  const cod = cashOnDeliveryAvailable(product);
  const white = style === 1;
  const skuText = sku ? ` (SKU ${sku})` : "";
  const whatsappHref = whatsappLink(`Hola, me interesa el producto ${displayName}${skuText}`);
  const notifyHref = whatsappLink(`Hola, avísenme cuando haya existencia de ${displayName}${skuText}.`);

  const threshold = siteConfig.freeShippingThreshold;
  const withThis = subtotal + priceInCents(view);
  const remaining = Math.max(threshold - withThis, 0);
  const progress = Math.min((withThis / threshold) * 100, 100);

  function buy() {
    if (!stock.inStock) return;
    if (addItem({ ...view, name: displayName })) {
      setToast(true);
      window.setTimeout(() => setToast(false), 2200);
    }
  }

  const buyButton = (size: "bar" | "full") =>
    stock.inStock ? (
      <button
        type="button"
        onClick={buy}
        className={`flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent font-bold text-accent-foreground transition-colors hover:bg-accent-strong ${size === "full" ? "w-full text-lg" : "px-5"}`}
      >
        <ShoppingCart aria-hidden className="size-5" /> Comprar
      </button>
    ) : (
      <span aria-disabled="true" className={`flex min-h-12 items-center justify-center rounded-lg bg-border font-semibold text-muted ${size === "full" ? "w-full" : "px-4 text-sm"}`}>
        Producto agotado
      </span>
    );

  return (
    <>
      {/* 1–3: encabezado, galería y opciones */}
      <div className={white ? "rounded-b-2xl bg-card pb-6 shadow-card" : ""}>
        <div className="container-shell grid gap-5 pt-4 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:pt-8">
          <div className="lg:col-start-2 lg:row-start-1">
            {brand && (
              <p className="text-sm text-muted">
                Marca:{" "}
                <Link href={`/productos?q=${encodeURIComponent(brand)}`} className="font-semibold text-foreground underline underline-offset-2 hover:text-primary-strong">
                  {brand}
                </Link>
              </p>
            )}
            <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">{product.name}</h1>
            <div className="mt-2 empty:hidden">
              <ProductBadge product={product} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              {rating ? (
                <a href="#resenas" className="flex min-h-11 items-center gap-1.5 text-sm">
                  <span className="font-semibold">{rating.value}</span>
                  <Stars value={rating.raw} />
                  <span className="text-muted hover:underline">{rating.count} opiniones</span>
                  <span className="sr-only">, ir a las reseñas</span>
                </a>
              ) : (
                <span className="text-sm text-muted">Sin opiniones aún</span>
              )}
              {sku && <span className="shrink-0 text-xs text-muted">SKU: {sku}</span>}
            </div>
          </div>

          <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <MediaGallery
              key={selectedId ?? "base"}
              images={view.images ?? []}
              video={video}
              name={product.name}
              framed={!white}
              actions={
                <>
                  <ShareButton title={product.name} tone={white ? "muted" : "outline"} />
                  <FavoriteButton product={product} tone={white ? "muted" : "outline"} />
                </>
              }
            />
          </div>

          {options && selectedId !== null && (
            <div className="lg:col-start-2 lg:row-start-2">
              <OptionPicker options={options} selectedId={selectedId} onSelect={setSelectedId} />
            </div>
          )}
        </div>
      </div>

      {/* 5–8: existencia y precio, envío, comprar, pago */}
      <div className="container-shell mt-6 grid gap-4 lg:grid-cols-2 lg:gap-x-10">
        <section aria-label="Existencia y precio">
          <p className={`text-sm font-semibold ${stockTone[stock.tone]}`}>{stock.label}</p>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-3">
            <span className="text-3xl font-black">A solo {money(view)}</span>
            {before && (
              <s className="text-base text-muted">
                <span className="sr-only">Precio anterior: </span>
                {before}
              </s>
            )}
          </p>
          {!stock.inStock && notifyHref && (
            <div className="mt-3">
              <a href={notifyHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary bg-card px-4 text-sm font-semibold text-primary-strong hover:bg-primary-soft">
                <Bell aria-hidden className="size-4" /> Avísame cuando haya existencia
              </a>
              <p className="mt-1.5 text-xs text-muted">Te avisaremos por WhatsApp cuando vuelva a estar disponible.</p>
            </div>
          )}
        </section>

        <section aria-labelledby="envio-titulo" className="rounded-xl border border-border bg-card p-4">
          <h2 id="envio-titulo" className="sr-only">
            Formas de envío
          </h2>
          <div className="flex gap-3">
            <Truck aria-hidden className="mt-0.5 size-6 shrink-0 text-primary" />
            <div className="text-sm">
              <p>
                Envío gratis en compras desde <strong>{formatMoney(threshold)}</strong>. Recibe tu pedido por medio de {siteConfig.shipping.carrier}.
              </p>
              <p className="mt-1 font-semibold">{delivery}</p>
            </div>
          </div>
          <div className="mt-4" role="status">
            <p className={`text-sm ${remaining === 0 ? "font-semibold text-success" : ""}`}>
              {remaining > 0 ? (
                <>
                  Agrega <strong>{formatMoney(remaining)}</strong> más y tu envío es gratis
                </>
              ) : (
                "¡Tu envío es gratis!"
              )}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface" aria-hidden>
              <div className={`h-full rounded-full transition-[width] ${remaining === 0 ? "bg-success" : "bg-primary"}`} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </section>

        <div>{buyButton("full")}</div>

        <section aria-labelledby="pago-titulo" className="rounded-xl border border-border bg-card p-4">
          <h2 id="pago-titulo" className="sr-only">
            Formas de pago
          </h2>
          <div className="flex gap-3 text-sm">
            <Landmark aria-hidden className="mt-0.5 size-6 shrink-0 text-primary" />
            <p>
              {cod
                ? `Paga tu producto por medio de transferencia, depósito o contra entrega con ${siteConfig.shipping.carrier}.`
                : "Paga tu producto por medio de transferencia o depósito."}{" "}
              Pronto habrá más formas de pago.
            </p>
          </div>
        </section>
      </div>

      {/* 9–12 */}
      <div className="container-shell mt-10 space-y-10">{children}</div>

      {/* Barra fija de compra */}
      <div className="buy-bar fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/75 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="container-shell flex h-[72px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xl font-black leading-tight">{money(view)}</p>
            {before && (
              <s className="text-xs text-muted">
                <span className="sr-only">Precio anterior: </span>
                {before}
              </s>
            )}
          </div>
          {whatsappHref && (
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="Consultar por WhatsApp" className="grid size-12 shrink-0 place-items-center rounded-lg bg-whatsapp text-white">
              <WhatsAppIcon className="size-6" />
            </a>
          )}
          {buyButton("bar")}
        </div>
      </div>

      <div role="status" className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4">
        {toast && (
          <p className="flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-card-hover">
            <Check aria-hidden className="size-4" /> Agregado al carrito
          </p>
        )}
      </div>
    </>
  );
}

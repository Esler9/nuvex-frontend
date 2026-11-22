"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductImagePlaceholder, placeholderBg } from "@/components/product-image-placeholder";
import { Sheet } from "@/components/ui/sheet";
import { useStore } from "@/components/store/store-provider";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { PromoPrice } from "@/components/promo-price";
import { forward } from "@/components/page-transition";

export function FavoritesDrawer() {
  const { panel, closePanel, favorites, removeFavorite } = useStore();
  const close = () => closePanel("favorites");

  return (
    <Sheet open={panel === "favorites"} onClose={close} title={`Mis favoritos (${favorites.length})`} side="right">
      {favorites.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center py-10 text-center">
          <Heart aria-hidden className="size-12 text-foreground" strokeWidth={1.5} />
          <p className="mt-4 text-lg font-semibold">Aún no tienes favoritos</p>
          <p className="mt-1 max-w-xs text-sm text-muted">Toca el corazón de un producto para guardarlo y verlo más tarde.</p>
          <Link href="/productos" onClick={close} className="mt-6 inline-flex min-h-12 items-center rounded-lg border border-primary px-6 font-semibold text-primary-strong transition-colors hover:bg-primary-soft">
            Ver productos
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border">
            {favorites.map((product) => {
              const img = product.images?.[0];
              const href = "/productos/" + encodeURIComponent(product.slug);
              return (
                <li key={product.id} className="flex gap-3 py-4">
                  <Link href={href} transitionTypes={forward} onClick={close} tabIndex={-1} aria-hidden className={`grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg ${img ? "bg-surface" : placeholderBg(product.name, product.categories)}`}>
                    {img ? (
                      <img src={img.src} alt="" width={80} height={80} loading="lazy" className="size-full object-contain p-1.5" />
                    ) : (
                      <ProductImagePlaceholder name={product.name} categories={product.categories} iconClassName="size-8" />
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={href} transitionTypes={forward} onClick={close} className="line-clamp-2 text-sm font-semibold hover:text-primary-strong">
                        {product.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFavorite(product.id)}
                        aria-label={`Quitar ${product.name} de favoritos`}
                        className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center rounded-full text-favorite hover:bg-surface"
                      >
                        <Heart aria-hidden className="size-5" fill="currentColor" strokeWidth={1.75} />
                      </button>
                    </div>
                    <PromoPrice product={product} variant="compact" />
                    <div className="mt-1">
                      <AddToCartButton product={product} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-center text-xs text-muted">Precio y disponibilidad pueden cambiar; se confirman al finalizar tu pedido.</p>
        </>
      )}
    </Sheet>
  );
}

import Link from "next/link";
import { Smartphone, Star } from "lucide-react";
import { money } from "@/lib/format";
import { brandOrMaterial, discountPercent, hasFastShipping, hasFreeShipping, ratingInfo, regularPriceLabel } from "@/lib/product-meta";
import { siteConfig } from "@/lib/site-config";
import type { CardVariant, Product } from "@/types/content";
import { FavoriteButton } from "@/components/favorite-button";

type Props = { product: Product; variant?: CardVariant; headingLevel?: 2 | 3 | 4 };

/**
 * Tarjeta de producto. Variante 1: toda blanca. Variante 2: imagen enmarcada sobre gris.
 * Toda la tarjeta abre el detalle (enlace extendido en el nombre).
 */
export function ProductCard({ product, variant = 2, headingLevel = 2 }: Props) {
  const img = product.images?.[0];
  const Heading = headingLevel === 4 ? "h4" : headingLevel === 3 ? "h3" : "h2";
  const href = "/productos/" + encodeURIComponent(product.slug);
  const discount = discountPercent(product);
  const before = regularPriceLabel(product);
  const rating = ratingInfo(product);
  const brand = brandOrMaterial(product);
  const freeShipping = hasFreeShipping(product);
  const outOfStock = product.is_in_stock === false;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow hover:shadow-card-hover">
      <div className={variant === 2 ? "p-2" : ""}>
        <div className={`relative flex aspect-square items-center justify-center ${variant === 2 ? "rounded-lg bg-image-well" : "bg-card"}`}>
          {img ? (
            <img
              src={img.thumbnail || img.src}
              alt=""
              width={300}
              height={300}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain p-3 transition-transform duration-300 motion-safe:group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted">
              <Smartphone aria-hidden className="size-10 text-primary/50" strokeWidth={1.5} />
              <span className="text-xs">Imagen próximamente</span>
            </div>
          )}
          {discount > 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold leading-4 text-accent-foreground">
              {discount}% OFF
            </span>
          )}
          <FavoriteButton product={product} size="sm" className="absolute right-1.5 top-1.5 z-10" />
        </div>
      </div>

      <div className={`flex flex-1 flex-col gap-1.5 px-3 pb-3 ${variant === 2 ? "pt-1" : "pt-3"} sm:px-4 sm:pb-4`}>
        <div className="flex min-h-4 items-center justify-between gap-2 text-xs">
          {rating ? (
            <span className="flex shrink-0 items-center gap-1">
              <span className="sr-only">
                Calificación {rating.value} de 5, {rating.count} {rating.count === 1 ? "reseña" : "reseñas"}
              </span>
              <span aria-hidden className="font-semibold text-foreground">
                {rating.value}
              </span>
              <Star aria-hidden className="size-3.5 fill-star text-star" />
              <span aria-hidden className="text-muted">
                ({rating.count})
              </span>
            </span>
          ) : (
            <span />
          )}
          {brand && <span className="truncate text-muted">{brand}</span>}
        </div>

        <Heading className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-foreground">
          <Link href={href} className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-primary">
            {product.name}
          </Link>
        </Heading>

        <div className="flex items-baseline justify-between gap-2">
          <p className="text-lg font-bold leading-6 text-foreground">{money(product)}</p>
          {before && (
            <p className="text-xs text-muted line-through">
              <span className="sr-only">Precio anterior: </span>
              {before}
            </p>
          )}
        </div>

        <div className="mt-auto flex min-h-4 items-center justify-between gap-2 text-xs font-semibold">
          {freeShipping ? <span className="text-accent-text">Envío gratis</span> : <span />}
          {outOfStock ? (
            <span className="text-muted">Agotado</span>
          ) : (
            hasFastShipping(product) && <span className="text-primary-strong">{siteConfig.fastShipping.label}</span>
          )}
        </div>
      </div>
    </article>
  );
}

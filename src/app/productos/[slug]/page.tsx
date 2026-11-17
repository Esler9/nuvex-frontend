import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star } from "lucide-react";
import { getProduct, money } from "@/lib/api";
import { brandOrMaterial, discountPercent, hasFastShipping, hasFreeShipping, ratingInfo, regularPriceLabel } from "@/lib/product-meta";
import { siteConfig } from "@/lib/site-config";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { FavoriteButton } from "@/components/favorite-button";
import { ProductGallery } from "@/components/product-gallery";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return { title: "Producto no encontrado" };
  return { title: p.name, description: `${p.name} — ${money(p)}. Envíos a todo Guatemala.`, alternates: { canonical: `/productos/${p.slug}` } };
}

export default async function ProductPage({ params }: Props) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const discount = discountPercent(p);
  const before = regularPriceLabel(p);
  const rating = ratingInfo(p);
  const brand = brandOrMaterial(p);

  return (
    <section className="container-shell py-8 sm:py-16">
      <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-strong hover:underline" href="/productos">
        ← Todos los productos
      </Link>
      <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12">
        <ProductGallery images={p.images ?? []} name={p.name} />
        <div>
          {brand && <p className="text-sm text-muted">{brand}</p>}
          <h1 className="mt-1 text-2xl font-bold sm:text-4xl">{p.name}</h1>
          {rating && (
            <p className="mt-2 flex items-center gap-1 text-sm">
              <span className="font-semibold">{rating.value}</span>
              <Star aria-hidden className="size-4 fill-star text-star" />
              <span className="text-muted">
                ({rating.count} {rating.count === 1 ? "reseña" : "reseñas"})
              </span>
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <p className="text-3xl font-black">{money(p)}</p>
            {before && (
              <p className="text-base text-muted line-through">
                <span className="sr-only">Precio anterior: </span>
                {before}
              </p>
            )}
            {discount > 0 && <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">{discount}% OFF</span>}
          </div>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
            <span className={p.is_in_stock === false ? "text-muted" : "text-foreground"}>{p.is_in_stock === false ? "Agotado" : "Disponible"}</span>
            {hasFreeShipping(p) && <span className="text-accent-text">Envío gratis</span>}
            {hasFastShipping(p) && <span className="text-primary-strong">{siteConfig.fastShipping.label}</span>}
          </p>
          <div className="mt-8 flex max-w-sm items-center gap-3">
            <div className="flex-1">
              <AddToCartButton product={p} />
            </div>
            <FavoriteButton product={p} className="shrink-0 border border-border" />
          </div>
          {p.short_description && <div className="prose-content mt-8 text-sm" dangerouslySetInnerHTML={{ __html: p.short_description }} />}
        </div>
      </div>
    </section>
  );
}

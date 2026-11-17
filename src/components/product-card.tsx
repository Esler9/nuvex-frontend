import Link from "next/link";
import { Smartphone } from "lucide-react";
import { money } from "@/lib/format";
import type { Product } from "@/types/content";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { FavoriteButton } from "@/components/favorite-button";

type Props = { product: Product; headingLevel?: 2 | 3 | 4 };

export function ProductCard({ product, headingLevel = 2 }: Props) {
  const img = product.images?.[0];
  const Heading = headingLevel === 4 ? "h4" : headingLevel === 3 ? "h3" : "h2";
  const href = "/productos/" + encodeURIComponent(product.slug);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow hover:shadow-card-hover">
      <Link href={href} className="block" tabIndex={-1} aria-hidden>
        <div className="flex aspect-square items-center justify-center bg-surface">
          {img ? (
            <img className="h-full w-full object-contain p-4 transition-transform duration-300 motion-safe:group-hover:scale-105" src={img.src} alt="" width={300} height={300} loading="lazy" decoding="async" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted">
              <Smartphone className="size-10 text-primary/50" strokeWidth={1.5} />
              <span className="text-xs">Imagen próximamente</span>
            </div>
          )}
        </div>
      </Link>
      <FavoriteButton product={product} className="absolute right-2 top-2" />
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Heading className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 sm:text-base sm:leading-6">
          <Link href={href} className="hover:text-primary-strong">
            {product.name}
          </Link>
        </Heading>
        <p className="mt-2 text-lg font-bold text-foreground">{money(product)}</p>
        <p className="mt-0.5 text-xs text-muted">{product.is_in_stock === false ? "Agotado" : "Disponible"}</p>
        <div className="mt-auto pt-3">
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}

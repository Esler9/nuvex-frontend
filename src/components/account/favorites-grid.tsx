"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import type { CardVariant, Product } from "@/types/content";
import { useStore } from "@/components/store/store-provider";
import { EmptyBlock } from "@/components/account/account-shell";
import { ProductCard } from "@/components/product-card";
import { ui } from "@/components/ui/styles";
import { siteConfig } from "@/lib/site-config";

/** Estilo de tarjeta según la categoría (mismo criterio que la página de inicio). */
function variantFor(p: Product): CardVariant {
  for (const c of p.categories ?? []) {
    const found = siteConfig.homeSections.find((s) => s.slug === c.slug);
    if (found) return found.cardVariant;
  }
  return 2;
}

export function FavoritesGrid() {
  const { favorites } = useStore();
  if (!favorites.length) {
    return (
      <EmptyBlock
        icon={<Heart aria-hidden className="size-12 text-foreground" strokeWidth={1.5} />}
        title="Aún no tienes favoritos"
        text="Toca el corazón de un producto para guardarlo y verlo más tarde."
        action={
          <Link href="/productos" className={ui.btnOutline}>
            Ver productos
          </Link>
        }
      />
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4">
      {favorites.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} variant={variantFor(p)} headingLevel={2} />
        </li>
      ))}
    </ul>
  );
}

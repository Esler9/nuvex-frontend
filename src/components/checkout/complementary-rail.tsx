"use client";

import { useEffect, useState } from "react";
import type { CardVariant, Product } from "@/types/content";
import { ProductCard } from "@/components/product-card";
import { AddToCartButton } from "@/components/add-to-cart-button";

type Item = { product: Product; variant: CardVariant };

/** "Te puede interesar": complementarios de lo que hay en el carrito, se agregan sin salir de la página. */
export function ComplementaryRail({ ids }: { ids: number[] }) {
  const key = [...ids].sort((a, b) => a - b).join(",");
  const [result, setResult] = useState<{ key: string; items: Item[] } | null>(null);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`/api/complementary?ids=${key}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items: Item[] }) => setResult({ key, items: data.items }))
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, items: [] });
      });
    return () => controller.abort();
  }, [key]);

  // Mientras llega la lista nueva se conserva la anterior, sin parpadeo.
  const items = result?.items ?? [];
  if (!key || !items.length) return null;

  return (
    <section aria-labelledby="te-puede-interesar" className="mt-8 border-t border-border pt-6">
      <h2 id="te-puede-interesar" className="text-lg font-bold">
        Te puede interesar
      </h2>
      <ul className="rail -mx-5 mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
        {items.map(({ product, variant }) => (
          <li key={product.id} className="flex w-[11.5rem] shrink-0 snap-start flex-col gap-2 sm:w-52">
            <ProductCard product={product} variant={variant} headingLevel={3} />
            <AddToCartButton product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}

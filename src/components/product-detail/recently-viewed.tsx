"use client";

import { useEffect } from "react";
import type { Product } from "@/types/content";
import { recentStore, useRecentProducts } from "@/lib/browsing-store";
import { ProductCard } from "@/components/product-card";

/** 11. Últimos 10 productos abiertos en este dispositivo (sin incluir el actual). */
export function RecentlyViewed({ current }: { current: Product }) {
  useEffect(() => {
    recentStore.add(current);
  }, [current]);

  const items = useRecentProducts()
    .filter((p) => p.id !== current.id)
    .slice(0, 10);
  if (!items.length) return null;

  return (
    <section aria-labelledby="vistos-recientemente">
      <h2 id="vistos-recientemente" className="mb-3 text-xl font-bold">
        Vistos recientemente
      </h2>
      <ul className="rail -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-3 sm:gap-4">
        {items.map((p) => (
          <li key={p.id} className="w-[42%] shrink-0 snap-start sm:w-[30%] lg:w-[calc((100%-4rem)/5)]">
            <ProductCard product={p} headingLevel={3} />
          </li>
        ))}
      </ul>
    </section>
  );
}

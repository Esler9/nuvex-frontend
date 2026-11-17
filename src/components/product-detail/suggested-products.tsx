"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CardVariant, Product } from "@/types/content";
import { ProductCard } from "@/components/product-card";
import { modelStore } from "@/lib/browsing-store";
import { isCompatible } from "@/lib/product-meta";

type Item = { product: Product; variant: CardVariant };
type Cursor = { phase: "cat" | "all"; page: number };

/** 12. Productos sugeridos con carga infinita: misma categoría primero, luego el resto. */
export function SuggestedProducts({ productId, category }: { productId: number; category?: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [next, setNext] = useState<Cursor | null>({ phase: category ? "cat" : "all", page: 1 });
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!next || loading || failed) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ exclude: String(productId), phase: next.phase, page: String(next.page) });
      if (category) qs.set("category", category);
      const res = await fetch(`/api/suggested?${qs}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { items: Item[]; next: Cursor | null };
      // Con un modelo elegido, los compatibles van primero dentro de cada tanda.
      const model = modelStore.current();
      const batch = model ? [...data.items].sort((a, b) => Number(isCompatible(b.product, model.model)) - Number(isCompatible(a.product, model.model))) : data.items;
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.product.id));
        return [...prev, ...batch.filter((i) => !seen.has(i.product.id))];
      });
      setNext(data.next);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [next, loading, failed, productId, category]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !next || failed) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) void load();
    }, { rootMargin: "600px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [load, next, failed]);

  if (!items.length && !next) return null;

  return (
    <section aria-labelledby="sugeridos">
      <h2 id="sugeridos" className="mb-3 text-xl font-bold">
        Productos sugeridos
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map(({ product, variant }) => (
          <li key={product.id}>
            <ProductCard product={product} variant={variant} headingLevel={3} />
          </li>
        ))}
      </ul>
      <div ref={sentinel} aria-hidden className="h-px" />
      <div role="status" className="py-4 text-center text-sm text-muted">
        {loading && "Cargando más productos…"}
      </div>
      {failed && (
        <div className="text-center">
          <button type="button" onClick={() => setFailed(false)} className="min-h-11 rounded-lg border border-primary px-5 text-sm font-semibold text-primary-strong">
            Reintentar
          </button>
        </div>
      )}
    </section>
  );
}

"use client";

import { useId } from "react";
import type { ProductOptions } from "@/types/content";

type Props = { options: NonNullable<ProductOptions>; selectedId: number; onSelect: (id: number) => void };

/** Colores (miniaturas) o capacidad (píldoras). Las opciones agotadas siguen seleccionables. */
export function OptionPicker({ options, selectedId, onSelect }: Props) {
  const id = useId();
  const selected = options.items.find((i) => i.id === selectedId);

  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-sm font-bold">
        {options.title}
        {selected && <span className="font-normal text-muted">: {selected.label}</span>}
      </h2>

      {options.kind === "color" ? (
        <div role="group" aria-labelledby={id} className="no-scrollbar -mx-5 mt-2 flex gap-3 overflow-x-auto px-5 pb-1">
          {options.items.map((item) => {
            const active = item.id === selectedId;
            const out = item.product.is_in_stock === false;
            const img = item.product.images?.[0];
            return (
              <button key={item.id} type="button" onClick={() => onSelect(item.id)} aria-pressed={active} className="w-[72px] shrink-0 rounded-lg text-center">
                <span className={`relative block size-[72px] overflow-hidden rounded-lg border-2 ${active ? "border-primary" : "border-border"} ${out ? "bg-surface" : "bg-image-well"}`}>
                  {img && <img src={img.thumbnail || img.src} alt="" width={72} height={72} loading="lazy" className={`size-full object-contain p-1 ${out ? "opacity-40 grayscale" : ""}`} />}
                  {out && <span aria-hidden className="sold-out-line absolute inset-0" />}
                </span>
                <span className={`mt-1 block text-xs ${active ? "font-semibold text-foreground" : "text-muted"}`}>
                  {item.label}
                  {out && <span className="sr-only">, agotado</span>}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div role="group" aria-labelledby={id} className="mt-2 flex flex-wrap gap-2">
          {options.items.map((item) => {
            const active = item.id === selectedId;
            const out = item.product.is_in_stock === false;
            const tone = active ? "border-primary bg-primary-soft text-primary-strong" : out ? "border-border bg-card text-muted line-through" : "border-border bg-card text-foreground hover:border-primary";
            return (
              <button key={item.id} type="button" onClick={() => onSelect(item.id)} aria-pressed={active} className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors ${tone}`}>
                {item.label}
                {out && <span className="sr-only">, agotado</span>}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

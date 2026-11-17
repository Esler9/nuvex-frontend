"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Check, X } from "lucide-react";
import { modelStore, useSelectedModel } from "@/lib/browsing-store";
import { siteConfig } from "@/lib/site-config";

const selectClass = "min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary disabled:opacity-50";

/** "¿Es compatible con tu celular?" — recuerda el modelo elegido en todo el sitio. */
export function CompatibilityChecker({ compatible }: { compatible: string[] }) {
  const id = useId();
  const selected = useSelectedModel();
  const [draftBrand, setDraftBrand] = useState<string | null>(null);
  const brands = Object.keys(siteConfig.phoneModels);
  const brand = draftBrand ?? selected?.brand ?? "";
  const models = brand ? (siteConfig.phoneModels[brand] ?? []) : [];
  const model = selected && selected.brand === brand ? selected.model : "";
  const ok = model ? compatible.some((m) => m.trim().toLowerCase() === model.toLowerCase()) : null;

  return (
    <section aria-labelledby={`${id}-title`} className="rounded-xl border border-border bg-card p-4">
      <h2 id={`${id}-title`} className="text-sm font-bold">
        ¿Es compatible con tu celular?
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={`${id}-brand`} className="sr-only">
            Marca de tu celular
          </label>
          <select
            id={`${id}-brand`}
            value={brand}
            onChange={(e) => {
              setDraftBrand(e.target.value);
              if (selected && selected.brand !== e.target.value) modelStore.set(null);
            }}
            className={selectClass}
          >
            <option value="">Marca</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-model`} className="sr-only">
            Modelo de tu celular
          </label>
          <select
            id={`${id}-model`}
            value={model}
            disabled={!brand}
            onChange={(e) => {
              modelStore.set(e.target.value ? { brand, model: e.target.value } : null);
              setDraftBrand(null);
            }}
            className={selectClass}
          >
            <option value="">Modelo</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div role="status" className="mt-3 text-sm font-semibold empty:hidden">
        {ok === true && (
          <p className="flex items-center gap-1.5 text-success">
            <Check aria-hidden className="size-4" /> Compatible con tu {model}
          </p>
        )}
        {ok === false && (
          <p className="flex flex-wrap items-center gap-x-1.5 text-danger">
            <X aria-hidden className="size-4" /> No es compatible con tu modelo.
            <Link href={`/productos?q=${encodeURIComponent(model)}`} className="font-semibold text-primary-strong underline underline-offset-2">
              Ver productos para tu modelo
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}

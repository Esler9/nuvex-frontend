"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import type { Promotion, PromotionScope, PromotionType } from "@/types/promotions";
import { savePromotionAction, searchCatalogAction, type CatalogHit } from "@/app/admin/order-actions";
import { Alert, Field, SubmitButton, describedBy, inputClass, useFormAction } from "@/components/admin/fields";

const section = "grid gap-4 rounded-xl border border-border bg-card p-4 sm:p-6";
const day = (iso?: string) => (iso ? iso.slice(0, 10) : "");

type Props = { promotion?: Promotion; categories: Array<{ slug: string; name: string }>; initialProducts: Array<{ id: number; name: string }> };

export function PromotionForm({ promotion, categories, initialProducts }: Props) {
  const { state, pending, onSubmit } = useFormAction(savePromotionAction);
  const errors = state?.fieldErrors ?? {};
  const [type, setType] = useState<PromotionType>(promotion?.type ?? "percent");
  const [scope, setScope] = useState<PromotionScope>(promotion?.scope ?? "all");
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CatalogHit[]>([]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const found = await searchCatalogAction(q);
      if (!cancelled) setHits(found);
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <form onSubmit={onSubmit} className="grid gap-6" noValidate>
      {state?.error && <Alert>{state.error}</Alert>}
      {promotion && <input type="hidden" name="id" value={promotion.id} />}

      <section className={section}>
        <Field name="name" label="Nombre interno" hint="Solo se ve en el panel." required error={errors.name}>
          <input {...describedBy("name", true, errors.name)} defaultValue={promotion?.name} placeholder="Ej. 5% para registrados diciembre" maxLength={80} required className={inputClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="type" label="Tipo" required>
            <select {...describedBy("type")} value={type} onChange={(e) => setType(e.target.value as PromotionType)} className={inputClass}>
              <option value="percent">Porcentaje de descuento</option>
              <option value="fixed">Monto fijo (Q por producto)</option>
            </select>
          </Field>
          <Field name="value" label={type === "percent" ? "Porcentaje (%)" : "Monto (Q)"} required error={errors.value}>
            <input
              {...describedBy("value", false, errors.value)}
              defaultValue={promotion ? (promotion.type === "percent" ? String(promotion.value) : (promotion.value / 100).toFixed(2)) : ""}
              placeholder={type === "percent" ? "5" : "10.00"}
              inputMode="decimal"
              required
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <section className={section}>
        <Field name="scope" label="Aplica a" required>
          <select {...describedBy("scope")} value={scope} onChange={(e) => setScope(e.target.value as PromotionScope)} className={inputClass}>
            <option value="all">Toda la tienda</option>
            <option value="category">Una o más categorías</option>
            <option value="products">Productos específicos</option>
          </select>
        </Field>
        {scope === "category" && (
          <fieldset aria-describedby={errors.categories ? "categories-error" : undefined}>
            <legend className="text-sm font-medium">Categorías</legend>
            {categories.length ? (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {categories.map((c) => (
                  <label key={c.slug} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="categories" value={c.slug} defaultChecked={promotion?.categorySlugs.includes(c.slug)} className="size-4 accent-primary-strong" />
                    {c.name}
                  </label>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">No se pudieron cargar las categorías.</p>
            )}
            {errors.categories && <p id="categories-error" className="mt-1 text-xs font-medium text-danger">{errors.categories}</p>}
          </fieldset>
        )}
        {scope === "products" && (
          <div className="grid gap-2">
            <label htmlFor="pr-search" className="text-sm font-medium">Productos</label>
            <div className="relative">
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input id="pr-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar producto" autoComplete="off" className={`${inputClass} pl-9`} />
              {query.trim().length >= 2 && hits.length > 0 && (
                <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-auto rounded-lg border border-border bg-card shadow-card-hover">
                  {hits.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setProducts((prev) => (prev.some((p) => p.id === h.id) ? prev : [...prev, { id: h.id, name: h.name }]));
                          setQuery("");
                          setHits([]);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-surface"
                      >
                        {h.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <ul className="flex flex-wrap gap-2">
              {products.map((p) => (
                <li key={p.id} className="inline-flex items-center gap-1 rounded-full bg-primary-soft py-1 pl-3 pr-1 text-sm text-primary-strong">
                  <input type="hidden" name="products" value={p.id} />
                  {p.name}
                  <button type="button" onClick={() => setProducts((prev) => prev.filter((x) => x.id !== p.id))} aria-label={`Quitar ${p.name}`} className="grid size-7 place-items-center rounded-full hover:bg-white/60">
                    <X aria-hidden className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            {errors.products && <p className="text-xs font-medium text-danger">{errors.products}</p>}
          </div>
        )}
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="registeredOnly" defaultChecked={promotion?.registeredOnly ?? true} className="size-4 accent-primary-strong" />
          Solo para clientes registrados
        </label>
      </section>

      <section className={section}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="startsAt" label="Fecha de inicio" hint="Opcional.">
            <input {...describedBy("startsAt", true)} type="date" defaultValue={day(promotion?.startsAt)} className={inputClass} />
          </Field>
          <Field name="endsAt" label="Fecha de fin" hint="Opcional. Termina al final de ese día." error={errors.endsAt}>
            <input {...describedBy("endsAt", true, errors.endsAt)} type="date" defaultValue={day(promotion?.endsAt)} className={inputClass} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="active" defaultChecked={promotion?.active ?? true} className="size-4 accent-primary-strong" />
          Promoción activada
        </label>
      </section>

      <div>
        <SubmitButton pending={pending}>Guardar promoción</SubmitButton>
      </div>
    </form>
  );
}

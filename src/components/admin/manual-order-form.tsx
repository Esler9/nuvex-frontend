"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
import type { OrderOrigin, PaymentMethod } from "@/types/account";
import { createManualOrderAction, searchCatalogAction, type CatalogHit } from "@/app/admin/order-actions";
import { Alert, Field, SubmitButton, describedBy, inputClass, useFormAction } from "@/components/admin/fields";
import { departments, guatemala } from "@/lib/guatemala";
import { formatMoney } from "@/lib/format";
import { originLabel, paymentLabel } from "@/lib/order-labels";
import { requiresNit } from "@/lib/checkout";
import { siteConfig } from "@/lib/site-config";

type Line = CatalogHit & { quantity: number; priceText: string };

const toCents = (q: string) => {
  const n = Number(q.replace(/[Qq\s,]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : 0;
};
const toText = (cents: number) => (cents / 100).toFixed(2);
const section = "grid gap-4 rounded-xl border border-border bg-card p-4 sm:p-6";

/** Pedido manual: ventas por WhatsApp, tienda o teléfono, con el mismo proceso que los del sitio. */
export function ManualOrderForm({ cfLimit }: { cfLimit: number }) {
  const { state, pending, onSubmit } = useFormAction(createManualOrderAction);
  const errors = state?.fieldErrors ?? {};

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CatalogHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [shippingText, setShippingText] = useState("");
  const [c, setC] = useState({ firstName: "", lastName: "", dpi: "", phone: "", email: "" });
  const [addr, setAddr] = useState({ fullName: "", department: "", municipality: "", zone: "", street: "", references: "" });
  const [needsNit, setNeedsNit] = useState(false);
  const [nit, setNit] = useState("");
  const [invoiceName, setInvoiceName] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("transferencia");

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const found = await searchCatalogAction(q);
        if (!cancelled) setHits(found);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const subtotal = lines.reduce((s, l) => s + toCents(l.priceText) * l.quantity, 0);
  const defaultShipping = subtotal === 0 || subtotal >= siteConfig.freeShippingThreshold ? 0 : siteConfig.checkout.shippingCost;
  const shipping = shippingText.trim() === "" ? defaultShipping : toCents(shippingText);
  const total = subtotal + shipping;
  const cfLocked = requiresNit(total, cfLimit);
  const nitOn = cfLocked || needsNit;
  const fullName = `${c.firstName} ${c.lastName}`.trim();
  const billingName = invoiceName ?? fullName;

  function add(hit: CatalogHit) {
    setLines((prev) => (prev.some((l) => l.id === hit.id) ? prev.map((l) => (l.id === hit.id ? { ...l, quantity: l.quantity + 1 } : l)) : [...prev, { ...hit, quantity: 1, priceText: toText(hit.price) }]));
    setQuery("");
    setHits([]);
  }
  const patchLine = (id: number, patch: Partial<Line>) => setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const payload = JSON.stringify({
    lines: lines.map((l) => ({ productId: l.id, slug: l.slug, name: l.name, image: l.image, categories: l.categories, unitPrice: toCents(l.priceText), quantity: l.quantity })),
    email: c.email,
    customer: { firstName: c.firstName, lastName: c.lastName },
    shippingData: { ...addr, fullName: addr.fullName || fullName, phone: c.phone },
    billing: { name: billingName, dpi: c.dpi, ...(nitOn ? { nit } : {}) },
    payment: { method, bank: "", reference: "", date: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guatemala" }).format(new Date()) },
  });

  const text = (name: keyof typeof c, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Field name={`c-${name}`} label={label} required>
      <input {...describedBy(`c-${name}`)} value={c[name]} onChange={(e) => setC({ ...c, [name]: e.target.value })} required className={inputClass} {...extra} />
    </Field>
  );

  return (
    <form onSubmit={onSubmit} className="grid gap-6" noValidate>
      {state?.error && <Alert>{state.error}</Alert>}
      <input type="hidden" name="payload" value={payload} />

      <section className={section} aria-labelledby="mo-productos">
        <h2 id="mo-productos" className="text-base font-semibold">Productos</h2>
        <div className="relative">
          <label htmlFor="mo-search" className="sr-only">Buscar en el inventario</label>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input id="mo-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar en el inventario por nombre" autoComplete="off" className={`${inputClass} pl-9`} />
          {query.trim().length >= 2 && (
            <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-72 overflow-auto rounded-lg border border-border bg-card shadow-card-hover" aria-live="polite">
              {searching && !hits.length ? (
                <li className="px-3 py-2 text-sm text-muted">Buscando…</li>
              ) : hits.length ? (
                hits.map((h) => (
                  <li key={h.id}>
                    <button type="button" onClick={() => add(h)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-surface">
                      <span className="size-9 shrink-0 overflow-hidden rounded bg-image-well">{h.image && <img src={h.image} alt="" className="size-full object-contain" />}</span>
                      <span className="min-w-0 flex-1 truncate">{h.name}</span>
                      <span className="font-semibold">{formatMoney(h.price)}</span>
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-sm text-muted">Sin resultados.</li>
              )}
            </ul>
          )}
        </div>
        {lines.length ? (
          <ul className="divide-y divide-border">
            {lines.map((l) => (
              <li key={l.id} className="grid gap-2 py-3 sm:grid-cols-[1fr_auto_8rem_auto] sm:items-center">
                <p className="text-sm font-medium">{l.name}</p>
                <div className="flex items-center rounded-full border border-border" role="group" aria-label={`Cantidad de ${l.name}`}>
                  <button type="button" onClick={() => patchLine(l.id, { quantity: Math.max(1, l.quantity - 1) })} aria-label="Quitar uno" className="grid size-9 place-items-center rounded-full hover:bg-surface"><Minus aria-hidden className="size-4" /></button>
                  <span className="min-w-6 text-center text-sm font-semibold">{l.quantity}</span>
                  <button type="button" onClick={() => patchLine(l.id, { quantity: Math.min(999, l.quantity + 1) })} aria-label="Agregar uno" className="grid size-9 place-items-center rounded-full hover:bg-surface"><Plus aria-hidden className="size-4" /></button>
                </div>
                <label className="text-xs text-muted">
                  Precio final c/u (Q)
                  <input value={l.priceText} onChange={(e) => patchLine(l.id, { priceText: e.target.value.replace(/[^\d.,]/g, "") })} inputMode="decimal" className={`${inputClass} mt-1`} />
                </label>
                <button type="button" onClick={() => setLines((prev) => prev.filter((x) => x.id !== l.id))} aria-label={`Quitar ${l.name}`} className="grid size-10 place-items-center justify-self-end rounded-full text-muted hover:bg-surface hover:text-danger"><Trash2 aria-hidden className="size-4" /></button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Busca y agrega los productos del pedido. El precio se puede ajustar si se negoció.</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="shipping" label="Costo de envío (Q)" hint={`Vacío = regla de la tienda (${formatMoney(defaultShipping)}).`} error={errors.shipping}>
            <input {...describedBy("shipping", true, errors.shipping)} value={shippingText} onChange={(e) => setShippingText(e.target.value.replace(/[^\d.,]/g, ""))} placeholder={toText(defaultShipping)} inputMode="decimal" className={inputClass} />
          </Field>
          <div className="self-end rounded-lg bg-surface px-4 py-3 text-sm">
            Subtotal {formatMoney(subtotal)} · Envío {formatMoney(shipping)} · <strong>Total {formatMoney(total)}</strong>
          </div>
        </div>
      </section>

      <section className={section} aria-labelledby="mo-cliente">
        <h2 id="mo-cliente" className="text-base font-semibold">Cliente</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("firstName", "Nombres", { placeholder: "Juan Carlos", maxLength: 60 })}
          {text("lastName", "Apellidos", { placeholder: "Pérez López", maxLength: 60 })}
          {text("dpi", "DPI", { inputMode: "numeric", placeholder: "13 dígitos", maxLength: 16 })}
          {text("phone", "Teléfono", { inputMode: "numeric", placeholder: "8 dígitos", maxLength: 10 })}
          <div className="sm:col-span-2">{text("email", "Correo electrónico", { type: "email", maxLength: 120 })}</div>
        </div>
      </section>

      <section className={section} aria-labelledby="mo-entrega">
        <h2 id="mo-entrega" className="text-base font-semibold">Dirección de entrega</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="a-fullName" label="Nombre de quien recibe" hint="Vacío = el mismo cliente.">
            <input {...describedBy("a-fullName", true)} value={addr.fullName} onChange={(e) => setAddr({ ...addr, fullName: e.target.value })} placeholder={fullName} maxLength={120} className={inputClass} />
          </Field>
          <Field name="a-department" label="Departamento" required>
            <select {...describedBy("a-department")} value={addr.department} onChange={(e) => setAddr({ ...addr, department: e.target.value, municipality: "" })} className={inputClass}>
              <option value="">Elige un departamento</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field name="a-municipality" label="Municipio" required>
            <select {...describedBy("a-municipality")} value={addr.municipality} onChange={(e) => setAddr({ ...addr, municipality: e.target.value })} disabled={!addr.department} className={inputClass}>
              <option value="">{addr.department ? "Elige un municipio" : "Primero el departamento"}</option>
              {(guatemala[addr.department] ?? []).map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field name="a-zone" label="Zona, barrio o colonia" required>
            <input {...describedBy("a-zone")} value={addr.zone} onChange={(e) => setAddr({ ...addr, zone: e.target.value })} maxLength={120} className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <Field name="a-street" label="Dirección exacta" required>
              <input {...describedBy("a-street")} value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} maxLength={200} className={inputClass} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field name="a-references" label="Referencias">
              <input {...describedBy("a-references")} value={addr.references} onChange={(e) => setAddr({ ...addr, references: e.target.value })} maxLength={200} className={inputClass} />
            </Field>
          </div>
        </div>
      </section>

      <section className={section} aria-labelledby="mo-factura">
        <h2 id="mo-factura" className="text-base font-semibold">Facturación</h2>
        <fieldset>
          <legend className="text-sm font-medium">¿Factura con NIT?</legend>
          <div className="mt-2 grid max-w-sm grid-cols-2 gap-2">
            {[false, true].map((yes) => {
              const disabled = !yes && cfLocked;
              const checked = nitOn === yes;
              return (
                <label key={String(yes)} className={`flex min-h-11 items-center justify-center rounded-lg border text-sm font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${disabled ? "cursor-not-allowed bg-surface text-muted/60" : checked ? "cursor-pointer border-primary bg-primary-soft text-primary-strong" : "cursor-pointer border-border"}`}>
                  <input type="radio" name="needsNitChoice" checked={checked} disabled={disabled} onChange={() => setNeedsNit(yes)} className="sr-only" />
                  {yes ? "Sí, NIT" : "No, CF"}
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          {nitOn && (
            <Field name="nit" label="NIT" required>
              <input {...describedBy("nit")} value={nit} onChange={(e) => setNit(e.target.value.replace(/[^\dkK-]/g, ""))} placeholder="Ej. 1234567-9" maxLength={15} className={inputClass} />
            </Field>
          )}
          <Field name="invoiceName" label="Nombre para la factura" required>
            <input {...describedBy("invoiceName")} value={billingName} onChange={(e) => setInvoiceName(e.target.value)} maxLength={120} className={inputClass} />
          </Field>
        </div>
      </section>

      <section className={section} aria-labelledby="mo-pago">
        <h2 id="mo-pago" className="text-base font-semibold">Pago y origen</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="origin" label="Origen del pedido" required>
            <select {...describedBy("origin")} defaultValue="whatsapp" className={inputClass}>
              {(Object.keys(originLabel) as OrderOrigin[]).map((o) => <option key={o} value={o}>{originLabel[o]}</option>)}
            </select>
          </Field>
          <Field name="method" label="Forma de pago" required>
            <select {...describedBy("method")} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={inputClass}>
              {(Object.keys(paymentLabel) as PaymentMethod[]).map((m) => <option key={m} value={m}>{paymentLabel[m]}</option>)}
            </select>
          </Field>
          <Field name="proof" label="Comprobante enviado por el cliente" hint="Foto o PDF, máximo 5 MB. Opcional." error={errors.proof}>
            <input {...describedBy("proof", true, errors.proof)} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-strong" />
          </Field>
          <label className="flex items-center gap-2 self-center text-sm font-medium">
            <input type="checkbox" name="paymentConfirmed" className="size-4 accent-primary-strong" />
            Pago confirmado
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pending={pending} pendingLabel="Creando…">Crear pedido</SubmitButton>
        <p className="text-xs text-muted">Se registran los correos de cada estado con el enlace “Ver mi pedido”. Si el correo tiene cuenta, aparece en sus compras.</p>
      </div>
    </form>
  );
}

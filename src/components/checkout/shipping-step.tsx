"use client";

import { useState, type FormEvent } from "react";
import { MapPin, Plus } from "lucide-react";
import type { SavedAddress } from "@/types/account";
import { useStore } from "@/components/store/store-provider";
import { AddressFields } from "@/components/checkout/address-fields";
import { TextField } from "@/components/ui/field";
import { ui } from "@/components/ui/styles";
import { useAccount } from "@/lib/account-store";
import { validateCheckoutForm, type CheckoutForm, type FieldErrors } from "@/lib/checkout";

export type ShippingState = { form: CheckoutForm; save: boolean; saveLabel: string; addressId: string | null };

export const emptyForm: CheckoutForm = {
  fullName: "",
  phone: "",
  email: "",
  department: "",
  municipality: "",
  zone: "",
  street: "",
  references: "",
  needsNit: false,
  nit: "",
  nitName: "",
  dpi: "",
};

type Props = { value: ShippingState; onChange: (next: ShippingState) => void; onContinue: () => void };

export function ShippingStep({ value, onChange, onContinue }: Props) {
  const { openPanel } = useStore();
  const account = useAccount();
  const [errors, setErrors] = useState<FieldErrors>({});
  const { form } = value;
  const set = (patch: Partial<CheckoutForm>) => {
    onChange({ ...value, form: { ...form, ...patch } });
    // Al corregir un campo se quita su error.
    setErrors((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(patch)) delete next[k as keyof CheckoutForm];
      return next;
    });
  };

  function choose(a: SavedAddress) {
    const billing = account?.billing[0];
    onChange({
      ...value,
      addressId: a.id,
      saveLabel: a.label,
      form: {
        ...form,
        fullName: a.fullName,
        phone: a.phone,
        email: a.email,
        department: a.department,
        municipality: a.municipality,
        zone: a.zone,
        street: a.street,
        references: a.references ?? "",
        dpi: billing?.dpi ?? form.dpi,
        needsNit: !!billing?.nit,
        nit: billing?.nit ?? "",
        nitName: billing?.nitName ?? "",
      },
    });
    setErrors({});
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const found = validateCheckoutForm(form);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      // Lleva el foco al primer campo con error.
      e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    onContinue();
  }

  const addresses = account?.addresses ?? [];

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-2xl space-y-5">
      {addresses.length > 0 && (
        <fieldset className={ui.card}>
          <legend className="sr-only">Direcciones guardadas</legend>
          <p className={ui.eyebrow}>Tus direcciones</p>
          <div className="mt-3 grid gap-2">
            {addresses.map((a) => (
              <label key={a.id} className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border p-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${value.addressId === a.id ? "border-primary bg-primary-soft" : "border-border"}`}>
                <input type="radio" name="saved-address" checked={value.addressId === a.id} onChange={() => choose(a)} className="sr-only" />
                <MapPin aria-hidden className={`mt-0.5 size-5 shrink-0 ${value.addressId === a.id ? "text-primary-strong" : "text-muted"}`} />
                <span className="text-sm">
                  <span className="font-semibold">{a.label}</span> — {a.zone}, {a.municipality}, {a.department}
                </span>
              </label>
            ))}
            <button
              type="button"
              onClick={() => {
                onChange({ ...value, addressId: null, saveLabel: "", form: { ...emptyForm, email: account?.customer.email ?? "" } });
                setErrors({});
              }}
              className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-lg px-2 text-sm font-semibold text-primary-strong hover:bg-primary-soft"
            >
              <Plus aria-hidden className="size-4" /> Usar otra dirección
            </button>
          </div>
        </fieldset>
      )}

      <fieldset className={`${ui.card} space-y-4`}>
        <legend className="sr-only">Datos de contacto</legend>
        <p className={ui.eyebrow}>Datos de contacto</p>
        <TextField id="co-name" name="fullName" label="Nombre completo" autoComplete="name" value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} error={errors.fullName} maxLength={100} />
        <TextField id="co-phone" name="phone" label="Teléfono" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="8 dígitos" value={form.phone} onChange={(e) => set({ phone: e.target.value.replace(/[^\d\s-]/g, "") })} error={errors.phone} maxLength={10} />
        <TextField
          id="co-email"
          name="email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          hint="Aquí te enviaremos tu factura y el estado de tu pedido."
          value={form.email}
          onChange={(e) => set({ email: e.target.value })}
          error={errors.email}
          maxLength={120}
        />
      </fieldset>

      <fieldset className={`${ui.card} space-y-4`}>
        <legend className="sr-only">Dirección de entrega</legend>
        <p className={ui.eyebrow}>Dirección de entrega</p>
        <AddressFields idPrefix="co" value={form} onChange={set} errors={errors} />
      </fieldset>

      <fieldset className={`${ui.card} space-y-4`}>
        <legend className="sr-only">Facturación</legend>
        <p className={ui.eyebrow}>Facturación</p>
        <div role="radiogroup" aria-labelledby="nit-q">
          <p id="nit-q" className="text-sm font-medium">
            ¿Necesitas factura con NIT?
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[false, true].map((yes) => (
              <label key={String(yes)} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-2 text-sm font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${form.needsNit === yes ? "border-primary bg-primary-soft text-primary-strong" : "border-border"}`}>
                <input type="radio" name="needsNit" checked={form.needsNit === yes} onChange={() => set({ needsNit: yes })} className="sr-only" />
                {yes ? "Sí" : "No"}
              </label>
            ))}
          </div>
          {!form.needsNit && <p className="mt-2 text-xs text-muted">La factura se emitirá a Consumidor Final (CF).</p>}
        </div>
        {form.needsNit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="co-nit" name="nit" label="NIT" autoComplete="off" placeholder="Ej. 1234567-9" value={form.nit} onChange={(e) => set({ nit: e.target.value })} error={errors.nit} maxLength={15} />
            <TextField id="co-nitname" name="nitName" label="Nombre para la factura" value={form.nitName} onChange={(e) => set({ nitName: e.target.value })} error={errors.nitName} maxLength={120} />
          </div>
        )}
        <TextField id="co-dpi" name="dpi" label="Número de DPI" inputMode="numeric" autoComplete="off" placeholder="13 dígitos" value={form.dpi} onChange={(e) => set({ dpi: e.target.value.replace(/[^\d\s]/g, "") })} error={errors.dpi} maxLength={15} />
      </fieldset>

      <div className={ui.card}>
        {account ? (
          <div className="space-y-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
              <input type="checkbox" checked={value.save} onChange={(e) => onChange({ ...value, save: e.target.checked })} className="size-5 accent-[var(--primary)]" />
              Guardar estos datos para mis próximas compras
            </label>
            {value.save && <TextField id="co-label" label="Nombre para esta dirección" placeholder="Ej. Casa, Trabajo" value={value.saveLabel} onChange={(e) => onChange({ ...value, saveLabel: e.target.value })} maxLength={40} />}
          </div>
        ) : (
          <p className="text-sm text-muted">
            <button type="button" onClick={() => openPanel("account")} className="font-semibold text-primary-strong underline underline-offset-2">
              Inicia sesión para guardar tus datos
            </button>{" "}
            o continúa sin iniciar sesión.
          </p>
        )}
      </div>

      {Object.keys(errors).length > 0 && (
        <p role="alert" className="text-center text-sm font-medium text-danger">
          Revisa los campos marcados en rojo para continuar.
        </p>
      )}
      <button type="submit" className={`${ui.btnPrimary} w-full`}>
        Continuar
      </button>
    </form>
  );
}

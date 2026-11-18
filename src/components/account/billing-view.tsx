"use client";

import { useState, type FormEvent } from "react";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import type { AccountData, SavedBilling } from "@/types/account";
import { useStore } from "@/components/store/store-provider";
import { EmptyBlock } from "@/components/account/account-shell";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TextField } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { ui } from "@/components/ui/styles";
import { accountStore } from "@/lib/account-store";
import { invoiceLabel, isValidNit } from "@/lib/checkout";

type Draft = { id?: string; name: string; dpi: string; needsNit: boolean; nit: string; nitName: string };

export function BillingView({ account }: { account: AccountData }) {
  const { notify } = useStore();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [toDelete, setToDelete] = useState<SavedBilling | null>(null);

  return (
    <div className="space-y-4">
      {account.billing.length === 0 ? (
        <EmptyBlock icon={<FileText aria-hidden className="size-12 text-primary" strokeWidth={1.5} />} title="Aún no tienes datos de facturación" text="Guárdalos al hacer una compra o agrégalos aquí." />
      ) : (
        <ul className="space-y-3">
          {account.billing.map((b) => (
            <li key={b.id} className={ui.card}>
              <div className="flex items-start gap-3 text-sm">
                <FileText aria-hidden className="mt-0.5 size-5 shrink-0 text-primary-strong" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-muted">DPI {b.dpi.replace(/(\d{4})(\d{5})(\d{4})/, "$1 $2 $3")}</p>
                  <p className="text-muted">{invoiceLabel(b)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setEditing({ id: b.id, name: b.name, dpi: b.dpi, needsNit: !!b.nit, nit: b.nit ?? "", nitName: b.nitName ?? "" })} className={ui.btnGhost}>
                  <Pencil aria-hidden className="size-4" /> Editar
                </button>
                <button type="button" onClick={() => setToDelete(b)} className={`${ui.btnGhost} hover:text-danger`}>
                  <Trash2 aria-hidden className="size-4" /> Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => setEditing({ name: account.customer.name, dpi: "", needsNit: false, nit: "", nitName: "" })} className={`${ui.btnOutline} w-full`}>
        <Plus aria-hidden className="size-4" /> Agregar datos de facturación
      </button>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Editar facturación" : "Nuevos datos de facturación"} side="right">
        {editing && (
          <BillingForm
            key={editing.id ?? "new"}
            initial={editing}
            onSave={(d) => {
              accountStore.saveBilling({ id: d.id, name: d.name.trim(), dpi: d.dpi.replace(/\D/g, ""), ...(d.needsNit ? { nit: d.nit.replace(/[\s-]/g, "").toUpperCase(), nitName: d.nitName.trim() } : {}) });
              setEditing(null);
              notify("Datos de facturación guardados");
            }}
          />
        )}
      </Sheet>
      <ConfirmDialog
        open={!!toDelete}
        title="¿Borrar estos datos de facturación?"
        message={toDelete ? `${toDelete.name} · ${invoiceLabel(toDelete)}` : undefined}
        confirmLabel="Borrar"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) accountStore.deleteBilling(toDelete.id);
          setToDelete(null);
          notify("Datos de facturación borrados");
        }}
      />
    </div>
  );
}

function BillingForm({ initial, onSave }: { initial: Draft; onSave: (d: Draft) => void }) {
  const [d, setD] = useState<Draft>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const found: Partial<Record<keyof Draft, string>> = {};
    if (d.name.trim().length < 3) found.name = "Escribe tu nombre completo.";
    if (d.dpi.replace(/\D/g, "").length !== 13) found.dpi = "El DPI debe tener 13 dígitos.";
    if (d.needsNit && !isValidNit(d.nit)) found.nit = "Revisa el NIT; no es válido.";
    if (d.needsNit && d.nitName.trim().length < 3) found.nitName = "Escribe el nombre para la factura.";
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) return e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    onSave(d);
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextField id="bi-name" name="name" label="Nombre completo" value={d.name} onChange={(e) => set({ name: e.target.value })} error={errors.name} maxLength={100} />
      <TextField id="bi-dpi" name="dpi" label="Número de DPI" inputMode="numeric" placeholder="13 dígitos" value={d.dpi} onChange={(e) => set({ dpi: e.target.value.replace(/[^\d\s]/g, "") })} error={errors.dpi} maxLength={15} />
      <fieldset>
        <legend className="text-sm font-medium">¿Factura con NIT?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[false, true].map((yes) => (
            <label key={String(yes)} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${d.needsNit === yes ? "border-primary bg-primary-soft text-primary-strong" : "border-border"}`}>
              <input type="radio" name="needsNit" checked={d.needsNit === yes} onChange={() => set({ needsNit: yes })} className="sr-only" />
              {yes ? "Sí, con NIT" : "No, CF"}
            </label>
          ))}
        </div>
      </fieldset>
      {d.needsNit && (
        <>
          <TextField id="bi-nit" name="nit" label="NIT" placeholder="Ej. 1234567-9" value={d.nit} onChange={(e) => set({ nit: e.target.value })} error={errors.nit} maxLength={15} />
          <TextField id="bi-nitname" name="nitName" label="Nombre para la factura" value={d.nitName} onChange={(e) => set({ nitName: e.target.value })} error={errors.nitName} maxLength={120} />
        </>
      )}
      <button type="submit" className={`${ui.btnPrimary} w-full`}>
        Guardar
      </button>
    </form>
  );
}

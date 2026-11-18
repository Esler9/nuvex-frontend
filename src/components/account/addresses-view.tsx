"use client";

import { useState, type FormEvent } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import type { AccountData, SavedAddress } from "@/types/account";
import { useStore } from "@/components/store/store-provider";
import { EmptyBlock } from "@/components/account/account-shell";
import { AddressFields } from "@/components/checkout/address-fields";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TextField } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { ui } from "@/components/ui/styles";
import { accountStore } from "@/lib/account-store";
import { formatAddress, validateCheckoutForm } from "@/lib/checkout";

type Draft = Omit<SavedAddress, "id" | "primary"> & { id?: string; primary?: boolean };
const blank = (email: string): Draft => ({ label: "", fullName: "", phone: "", email, department: "", municipality: "", zone: "", street: "", references: "" });

export function AddressesView({ account }: { account: AccountData }) {
  const { notify } = useStore();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [toDelete, setToDelete] = useState<SavedAddress | null>(null);

  return (
    <div className="space-y-4">
      {account.addresses.length === 0 ? (
        <EmptyBlock icon={<MapPin aria-hidden className="size-12 text-primary" strokeWidth={1.5} />} title="Aún no tienes direcciones guardadas" text="Guárdalas al hacer una compra o agrégalas aquí." />
      ) : (
        <ul className="space-y-3">
          {account.addresses.map((a) => (
            <li key={a.id} className={ui.card}>
              <div className="flex items-start gap-3">
                <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-primary-strong" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {a.label}
                    {a.primary && <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-strong">Principal</span>}
                  </p>
                  <p className="mt-1">{a.fullName} · Tel. {a.phone}</p>
                  <p className="text-muted">{formatAddress(a)}</p>
                  {a.references && <p className="text-muted">Referencias: {a.references}</p>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setEditing({ ...a })} className={ui.btnGhost}>
                  <Pencil aria-hidden className="size-4" /> Editar
                </button>
                {!a.primary && (
                  <button type="button" onClick={() => accountStore.setPrimaryAddress(a.id)} className={ui.btnGhost}>
                    Marcar como principal
                  </button>
                )}
                <button type="button" onClick={() => setToDelete(a)} className={`${ui.btnGhost} hover:text-danger`}>
                  <Trash2 aria-hidden className="size-4" /> Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => setEditing(blank(account.customer.email))} className={`${ui.btnOutline} w-full`}>
        <Plus aria-hidden className="size-4" /> Agregar dirección
      </button>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Editar dirección" : "Nueva dirección"} side="right">
        {editing && (
          <AddressForm
            key={editing.id ?? "new"}
            initial={editing}
            onSave={(d) => {
              accountStore.saveAddress(d);
              setEditing(null);
              notify("Dirección guardada");
            }}
          />
        )}
      </Sheet>
      <ConfirmDialog
        open={!!toDelete}
        title="¿Borrar esta dirección?"
        message={toDelete ? `${toDelete.label} — ${formatAddress(toDelete)}` : undefined}
        confirmLabel="Borrar"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) accountStore.deleteAddress(toDelete.id);
          setToDelete(null);
          notify("Dirección borrada");
        }}
      />
    </div>
  );
}

function AddressForm({ initial, onSave }: { initial: Draft; onSave: (d: Draft) => void }) {
  const [d, setD] = useState<Draft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Reutiliza las reglas de la orden de compra (sin los campos de facturación).
    const all = validateCheckoutForm({ ...d, references: d.references ?? "", needsNit: false, nit: "", nitName: "", dpi: "0000000000000" });
    const found: Record<string, string> = { ...all };
    if (d.label.trim().length < 2) found.label = "Ponle un nombre, por ejemplo Casa o Trabajo.";
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) return e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    onSave({ ...d, label: d.label.trim(), fullName: d.fullName.trim(), phone: d.phone.replace(/\D/g, ""), email: d.email.trim() });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextField id="ad-label" name="label" label="Nombre de la dirección" placeholder="Ej. Casa, Trabajo" value={d.label} onChange={(e) => set({ label: e.target.value })} error={errors.label} maxLength={40} />
      <TextField id="ad-name" name="fullName" label="Quien recibe" autoComplete="name" value={d.fullName} onChange={(e) => set({ fullName: e.target.value })} error={errors.fullName} maxLength={100} />
      <TextField id="ad-phone" name="phone" label="Teléfono" type="tel" inputMode="numeric" placeholder="8 dígitos" value={d.phone} onChange={(e) => set({ phone: e.target.value.replace(/[^\d\s-]/g, "") })} error={errors.phone} maxLength={10} />
      <TextField id="ad-email" name="email" label="Correo electrónico" type="email" value={d.email} onChange={(e) => set({ email: e.target.value })} error={errors.email} maxLength={120} />
      <AddressFields idPrefix="ad" value={d} onChange={set} errors={errors} />
      <button type="submit" className={`${ui.btnPrimary} w-full`}>
        Guardar dirección
      </button>
    </form>
  );
}

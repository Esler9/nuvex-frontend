"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera, FileText, Info, Landmark, Upload, X } from "lucide-react";
import type { PaymentData, PaymentMethod } from "@/types/account";
import { CopyButton } from "@/components/ui/copy-button";
import { SelectField, TextField } from "@/components/ui/field";
import { ui } from "@/components/ui/styles";
import { gtq } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";

const methods: Array<{ id: PaymentMethod; label: string; text: string }> = [
  { id: "deposito", label: "Depósito bancario", text: "Deposita en agencia o agente bancario." },
  { id: "transferencia", label: "Transferencia bancaria", text: "Transfiere desde tu banca en línea o app." },
];

type Props = {
  total: number;
  submitLabel?: string;
  /** Si existe, el envío está deshabilitado y se muestra este aviso. */
  blockedReason?: string;
  onSubmit: (payment: PaymentData, file: File) => void;
};

function todayInGuatemala() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guatemala" }).format(new Date());
}

/** Forma de pago, cuentas de la tienda, datos de la boleta y comprobante. */
export function PaymentForm({ total, submitLabel = "Enviar comprobante", blockedReason, onSubmit }: Props) {
  const cfg = siteConfig.checkout;
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [bank, setBank] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const today = todayInGuatemala();

  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);

  function pick(f: File | undefined) {
    if (!f) return;
    if (!cfg.receiptTypes.includes(f.type)) return setFileError("Sube una foto JPG o PNG, o un PDF.");
    if (f.size > cfg.receiptMaxBytes) return setFileError("El archivo pesa más de 5 MB. Sube uno más liviano.");
    setFileError("");
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    if (cameraRef.current) cameraRef.current.value = "";
    if (fileRef.current) fileRef.current.value = "";
  }

  const dateValid = !!date && date <= today;
  const complete = !!method && !!bank && reference.trim().length >= 3 && dateValid && !!file;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!complete || blockedReason || !method || !file) return;
    onSubmit({ method, bank, reference: reference.trim(), date, receiptName: file.name }, file);
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5">
      <fieldset className={ui.card}>
        <legend className="sr-only">Forma de pago</legend>
        <p className={ui.eyebrow}>Forma de pago</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {methods.map((m) => (
            <label key={m.id} className={`flex min-h-16 cursor-pointer flex-col justify-center rounded-xl border p-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${method === m.id ? "border-primary bg-primary-soft" : "border-border"}`}>
              <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="sr-only" />
              <span className={`font-semibold ${method === m.id ? "text-primary-strong" : ""}`}>{m.label}</span>
              <span className="text-xs text-muted">{m.text}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <section aria-labelledby="cuentas-titulo" className={ui.card}>
        <h2 id="cuentas-titulo" className={ui.eyebrow}>
          Cuentas de la tienda
        </h2>
        <ul className="mt-3 space-y-3">
          {cfg.bankAccounts.map((a) => (
            <li key={a.number} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
              {/* Marcador del logo: reemplázalo por el logo oficial del banco cuando lo tengas. */}
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-strong">
                <Landmark aria-hidden className="size-5" />
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold">{a.bank}</p>
                <p className="text-muted">Cuenta {a.type.toLowerCase()}</p>
                <p className="mt-0.5 font-mono text-base font-semibold tracking-wide">{a.number}</p>
                <p className="text-muted">A nombre de {a.holder}</p>
              </div>
              <CopyButton text={a.number} notice="Número de cuenta copiado" />
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-4">
          <span className="font-semibold">Total a pagar:</span>
          <span className="text-3xl font-black">{gtq(total)}</span>
        </p>
      </section>

      <fieldset className={`${ui.card} space-y-4`}>
        <legend className="sr-only">Datos del pago</legend>
        <p className={ui.eyebrow}>Datos del pago</p>
        <SelectField id="pay-bank" label="Banco donde hiciste el pago" placeholder="Elige el banco" options={cfg.banks} value={bank} onChange={(e) => setBank(e.target.value)} />
        <TextField id="pay-ref" label="Número de boleta o referencia" inputMode="text" autoComplete="off" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={40} />
        <TextField id="pay-date" label="Fecha del pago" type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} error={date && !dateValid ? "La fecha no puede ser futura." : undefined} />
      </fieldset>

      <fieldset className={`${ui.card} space-y-3`}>
        <legend className="sr-only">Comprobante</legend>
        <p className={ui.eyebrow}>Sube tu comprobante</p>
        <p className="flex gap-2 rounded-lg bg-accent-soft p-3 text-sm text-foreground">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-text" />
          Sube la foto original de tu boleta o la captura de tu transferencia, sin recortes ni modificaciones. Verificaremos el pago directamente en nuestra cuenta bancaria.
        </p>
        <input ref={cameraRef} id="pay-camera" type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} onChange={(e) => pick(e.target.files?.[0])} />
        <input ref={fileRef} id="pay-file" type="file" accept={cfg.receiptTypes.join(",")} className="sr-only" tabIndex={-1} onChange={(e) => pick(e.target.files?.[0])} />
        {file ? (
          <div className="flex items-center gap-3 rounded-xl border border-border p-3">
            {preview ? <img src={preview} alt="Vista previa del comprobante" className="size-20 rounded-lg object-cover" /> : <FileText aria-hidden className="size-10 text-primary" />}
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-semibold">{file.name}</p>
              <p className="text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button type="button" onClick={clearFile} aria-label="Quitar comprobante" className="grid size-11 place-items-center rounded-full text-muted hover:bg-surface hover:text-foreground">
              <X aria-hidden className="size-5" />
            </button>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => cameraRef.current?.click()} className={`${ui.btnGhost} min-h-12 sm:hidden`}>
              <Camera aria-hidden className="size-5" /> Tomar foto
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className={`${ui.btnGhost} min-h-12 sm:col-span-2`}>
              <Upload aria-hidden className="size-5" /> Elegir foto o PDF
            </button>
          </div>
        )}
        <p className="text-xs text-muted">JPG, PNG o PDF, máximo 5 MB.</p>
        {fileError && (
          <p role="alert" className="text-sm font-medium text-danger">
            {fileError}
          </p>
        )}
      </fieldset>

      {blockedReason && (
        <p role="status" className="rounded-lg bg-primary-soft p-3 text-center text-sm text-primary-strong">
          {blockedReason}
        </p>
      )}
      <button type="submit" disabled={!complete || !!blockedReason} className={`${ui.btnPrimary} w-full`}>
        {submitLabel}
      </button>
      {!complete && !blockedReason && <p className="text-center text-xs text-muted">Completa la forma de pago, los datos del pago y el comprobante para continuar.</p>}
    </form>
  );
}

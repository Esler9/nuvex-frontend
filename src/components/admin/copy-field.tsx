"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Botón "Copiar" del panel (no depende de la tienda): confirma en el mismo botón. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setState("ok");
        } catch {
          setState("fail");
        }
        window.setTimeout(() => setState("idle"), 1800);
      }}
      aria-label={`Copiar ${label}`}
      className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-semibold text-primary-strong transition-colors hover:bg-primary-soft"
    >
      {state === "ok" ? <Check aria-hidden className="size-3.5" /> : <Copy aria-hidden className="size-3.5" />}
      <span aria-live="polite">{state === "ok" ? "Copiado" : state === "fail" ? "No se pudo" : "Copiar"}</span>
    </button>
  );
}

/** Fila "dato + Copiar" para facturar y para la guía de Cargo Expreso. */
export function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className={`break-words text-sm font-medium ${mono ? "font-mono tabular-nums" : ""}`}>{value || "—"}</dd>
      </div>
      {value && <CopyButton value={value} label={label} />}
    </div>
  );
}

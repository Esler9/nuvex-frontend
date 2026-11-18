"use client";

import { startTransition, useActionState, type FormEvent, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/types/admin";

/**
 * Como useActionState, pero sin el reinicio automático del formulario de React 19:
 * si el servidor devuelve errores de validación, lo escrito se conserva.
 */
export function useFormAction(action: (state: FormState, form: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState(action, undefined);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  };
  return { state, pending, onSubmit };
}

export const inputClass =
  "block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-[invalid=true]:border-danger disabled:bg-surface disabled:text-muted";

/** Etiqueta, ayuda y error accesibles. El control recibe id={name} y aria-describedby desde `describedBy(name)`. */
export function Field({ name, label, hint, error, required, children }: { name: string; label: string; hint?: string; error?: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-danger" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && <p id={`${name}-hint`} className="text-xs text-muted">{hint}</p>}
      {error && <p id={`${name}-error`} className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

export function describedBy(name: string, hasHint?: boolean, error?: string) {
  const ids = [hasHint && `${name}-hint`, error && `${name}-error`].filter(Boolean).join(" ");
  return { id: name, name, "aria-invalid": error ? true : undefined, "aria-describedby": ids || undefined } as const;
}

export function SubmitButton({ children, pending, pendingLabel = "Guardando…" }: { children: ReactNode; pending: boolean; pendingLabel?: string }) {
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary-strong px-5 text-sm font-semibold text-white transition-colors hover:bg-navy disabled:cursor-wait disabled:opacity-70">
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Botón de envío que pide confirmación antes de acciones destructivas. */
export function ConfirmButton({ message, children }: { message: string; children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-danger/40 px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger/5 disabled:opacity-60"
    >
      {pending ? "Eliminando…" : children}
    </button>
  );
}

export function Alert({ tone = "danger", children }: { tone?: "danger" | "success" | "info"; children: ReactNode }) {
  const styles = {
    danger: "border-danger/30 bg-danger/5 text-danger",
    success: "border-success/30 bg-success/5 text-success",
    info: "border-primary/30 bg-primary-soft text-primary-strong",
  }[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm font-medium ${styles}`}>
      {children}
    </div>
  );
}

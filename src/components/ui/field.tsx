"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { ui } from "@/components/ui/styles";

type Common = { id: string; label: string; error?: string; hint?: ReactNode; optional?: boolean };

function Wrapper({ id, label, error, hint, optional, children }: Common & { children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional && <span className="font-normal text-muted"> (opcional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: ReactNode) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

/** Campo de texto con etiqueta, ayuda y error accesibles (aria-invalid + aria-describedby). */
export function TextField({ id, label, error, hint, optional, ...input }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} optional={optional}>
      <input id={id} aria-invalid={!!error} aria-describedby={describedBy(id, error, hint)} className={ui.input} {...input} />
    </Wrapper>
  );
}

export function SelectField({ id, label, error, hint, optional, options, placeholder, ...select }: Common & SelectHTMLAttributes<HTMLSelectElement> & { options: string[]; placeholder: string }) {
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} optional={optional}>
      <select id={id} aria-invalid={!!error} aria-describedby={describedBy(id, error, hint)} className={ui.input} {...select}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}

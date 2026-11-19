"use client";

import { saveSettingsAction } from "@/app/admin/order-actions";
import { Alert, Field, SubmitButton, describedBy, inputClass, useFormAction } from "@/components/admin/fields";

export function SettingsForm({ cfLimit }: { cfLimit: number }) {
  const { state, pending, onSubmit } = useFormAction(saveSettingsAction);
  const errors = state?.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:p-6" noValidate>
      {state?.error && <Alert>{state.error}</Alert>}
      <Field name="cfLimit" label="Monto límite para Consumidor Final (Q)" hint="Desde este total, la compra exige factura con NIT: el botón “No” se desactiva y se selecciona “Sí”. Aplica en el sitio y en pedidos manuales." required error={errors.cfLimit}>
        <input {...describedBy("cfLimit", true, errors.cfLimit)} defaultValue={(cfLimit / 100).toFixed(2)} inputMode="decimal" required className={`${inputClass} max-w-48`} />
      </Field>
      <div>
        <SubmitButton pending={pending}>Guardar</SubmitButton>
      </div>
    </form>
  );
}

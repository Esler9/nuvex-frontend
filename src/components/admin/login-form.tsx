"use client";

import { loginAction } from "@/app/admin/actions";
import { Alert, Field, SubmitButton, inputClass, useFormAction } from "@/components/admin/fields";

export function LoginForm({ next }: { next: string }) {
  const { state, pending, onSubmit } = useFormAction(loginAction);
  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {state?.error && <Alert>{state.error}</Alert>}
      <input type="hidden" name="next" value={next} />
      <Field name="email" label="Correo">
        <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} />
      </Field>
      <Field name="password" label="Contraseña">
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </Field>
      <SubmitButton pending={pending} pendingLabel="Verificando…">Iniciar sesión</SubmitButton>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { lookupOrderAction } from "@/app/(store)/actions";
import { TextField } from "@/components/ui/field";
import { ui } from "@/components/ui/styles";

/** Número de compra + correo → abre el detalle de esa compra. */
export function LookupForm() {
  const [state, action, pending] = useActionState(lookupOrderAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <TextField id="lk-id" name="id" label="Número de compra" placeholder="Ej. 02-40321" autoComplete="off" required maxLength={20} />
      <TextField id="lk-email" name="email" label="Correo electrónico" type="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" required maxLength={120} />
      {state?.error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${ui.btnBlue} w-full disabled:cursor-wait disabled:opacity-70`}>
        {pending ? "Buscando…" : "Ver mi pedido"}
      </button>
    </form>
  );
}

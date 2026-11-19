"use client";

import { useState, type FormEvent } from "react";
import { Sheet } from "@/components/ui/sheet";
import { useStore, type AccountMode } from "@/components/store/store-provider";
import { accountStore } from "@/lib/account-store";

const inputClass = "mt-1.5 block min-h-12 w-full rounded-xl border border-border bg-card px-4 text-base text-foreground placeholder:text-muted/70 focus:border-primary";

/** "ana.lopez@correo.com" → "Ana" (solo para el saludo de la cuenta de demostración). */
export function nameFromEmail(email: string) {
  const first = email.split("@")[0].split(/[._\-+\d]/).find(Boolean) ?? "cliente";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export function AccountDialog() {
  const { panel, closePanel, demo, notify, accountMode: mode, setAccountMode } = useStore();
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") || "").trim().toLowerCase();
    // La contraseña nunca se guarda ni se envía: la autenticación real se conectará con WooCommerce.
    event.currentTarget.reset();
    if (demo && email) {
      const name = nameFromEmail(email);
      // Iniciar sesión abre la cuenta de ejemplo; crear cuenta empieza vacía. En ambos casos
      // se unen las compras hechas antes con ese correo.
      if (mode === "login") accountStore.login({ name, email });
      else accountStore.register({ name, email });
      closePanel("account");
      notify(mode === "login" ? `Hola, ${name}. Iniciaste sesión (demostración).` : `Listo, ${name}. Tu cuenta fue creada (demostración).`);
      return;
    }
    setNotice("Las cuentas de cliente se habilitarán pronto. Mientras tanto puedes comprar sin registrarte.");
  }

  function switchMode(next: AccountMode) {
    setAccountMode(next);
    setNotice("");
  }

  const isLogin = mode === "login";

  return (
    <Sheet open={panel === "account"} onClose={() => closePanel("account")} title={isLogin ? "Iniciar sesión" : "Crear cuenta"} side="center">
      <div className="mb-6 grid grid-cols-2 rounded-lg bg-surface p-1 text-sm font-semibold">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => switchMode(m)}
            className={`min-h-11 rounded-md transition-colors ${mode === m ? "bg-card text-primary-strong shadow-sm" : "text-muted hover:text-foreground"}`}
          >
            {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </button>
        ))}
      </div>

      <form key={mode} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="account-email" className="text-sm font-medium">
            Correo electrónico
          </label>
          <input id="account-email" name="email" type="email" required autoComplete="email" placeholder="tucorreo@ejemplo.com" className={inputClass} />
        </div>
        <div>
          <label htmlFor="account-password" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="account-password"
            name="password"
            type="password"
            required
            minLength={isLogin ? undefined : 8}
            autoComplete={isLogin ? "current-password" : "new-password"}
            aria-describedby={isLogin ? undefined : "password-hint"}
            className={inputClass}
          />
          {!isLogin && (
            <p id="password-hint" className="mt-1.5 text-xs text-muted">
              Mínimo 8 caracteres.
            </p>
          )}
        </div>
        <button type="submit" className="min-h-12 w-full rounded-lg bg-primary-strong px-6 font-bold text-white transition-colors hover:bg-navy">
          {isLogin ? "Entrar" : "Crear cuenta"}
        </button>
        {/* Mismo espacio que ya existía debajo del botón: aviso o, al iniciar sesión, la invitación a crear cuenta. */}
        <div role="status" className="min-h-5 text-center text-sm">
          {notice ? (
            <p className="text-primary-strong">{notice}</p>
          ) : (
            isLogin && (
              <p className="text-xs text-muted">
                ¿No tienes cuenta?{" "}
                <button type="button" onClick={() => switchMode("register")} className="font-semibold text-primary underline-offset-2 hover:underline">
                  Crea tu cuenta
                </button>{" "}
                para dar seguimiento a tu pedido.
              </p>
            )
          )}
        </div>
        {demo && <p className="rounded-lg bg-surface p-3 text-center text-xs text-muted">Modo demostración: cualquier correo abre una cuenta de ejemplo en este dispositivo. La contraseña no se guarda.</p>}
      </form>
    </Sheet>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { Sheet } from "@/components/ui/sheet";
import { useStore } from "@/components/store/store-provider";

type Mode = "login" | "register";

const inputClass = "mt-1.5 block min-h-12 w-full rounded-xl border border-border bg-card px-4 text-base text-foreground placeholder:text-muted/70 focus:border-primary";

export function AccountDialog() {
  const { panel, closePanel } = useStore();
  const [mode, setMode] = useState<Mode>("login");
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // La autenticación real se conectará con WooCommerce. No se guarda ni envía la contraseña.
    event.currentTarget.reset();
    setNotice("Las cuentas de cliente se habilitarán pronto. Mientras tanto puedes comprar sin registrarte.");
  }

  function switchMode(next: Mode) {
    setMode(next);
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
        <p role="status" className="min-h-5 text-center text-sm text-primary-strong">
          {notice}
        </p>
      </form>
    </Sheet>
  );
}

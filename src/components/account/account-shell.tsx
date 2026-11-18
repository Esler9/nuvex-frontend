"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, UserRound } from "lucide-react";
import type { AccountData } from "@/types/account";
import { useStore } from "@/components/store/store-provider";
import { ui } from "@/components/ui/styles";
import { useAccount } from "@/lib/account-store";

type Props = {
  title: string;
  back?: { href: string; label: string };
  children: (account: AccountData) => ReactNode;
};

/** Marco de las páginas de Mi cuenta: exige sesión y muestra carga mientras se lee el dispositivo. */
export function AccountShell({ title, back = { href: "/mi-cuenta", label: "Mi cuenta" }, children }: Props) {
  const account = useAccount();
  const { openPanel } = useStore();

  return (
    <div className="container-shell max-w-3xl py-6 sm:py-8">
      <Link href={back.href} className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-primary-strong hover:bg-primary-soft">
        <ChevronLeft aria-hidden className="size-4" /> {back.label}
      </Link>
      <h1 className={`${ui.pageTitle} mt-2`}>{title}</h1>
      <div className="mt-5">
        {account === undefined ? (
          <div className="space-y-3" aria-busy="true" aria-label="Cargando">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-card motion-reduce:animate-none" />
            ))}
          </div>
        ) : account === null ? (
          <div className="flex flex-col items-center rounded-xl border border-border bg-card px-6 py-12 text-center">
            <UserRound aria-hidden className="size-12 text-primary" strokeWidth={1.5} />
            <p className="mt-4 text-lg font-semibold">Inicia sesión para ver tu información</p>
            <p className="mt-1 max-w-xs text-sm text-muted">Tus compras, puntos, direcciones y opiniones aparecen aquí.</p>
            <button type="button" onClick={() => openPanel("account")} className={`${ui.btnOutline} mt-6`}>
              Iniciar sesión
            </button>
          </div>
        ) : (
          children(account)
        )}
      </div>
    </div>
  );
}

/** Estado vacío con el mismo estilo que el carrito y favoritos. */
export function EmptyBlock({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-card px-6 py-12 text-center">
      {icon}
      <p className="mt-4 text-lg font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

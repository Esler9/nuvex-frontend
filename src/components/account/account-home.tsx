"use client";

import { AccountShell } from "@/components/account/account-shell";
import { AccountLinks } from "@/components/account/account-links";
import { ui } from "@/components/ui/styles";

export function AccountHome() {
  return (
    <AccountShell title="Mi cuenta" back={{ href: "/", label: "Inicio" }}>
      {(a) => (
        <div className="space-y-4">
          <div className={ui.card}>
            <p className="font-semibold">Hola, {a.customer.name}</p>
            <p className="text-sm text-muted">{a.customer.email}</p>
          </div>
          <div className={`${ui.card} p-2 sm:p-2`}>
            <AccountLinks />
          </div>
        </div>
      )}
    </AccountShell>
  );
}

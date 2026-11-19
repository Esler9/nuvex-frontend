"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useStore } from "@/components/store/store-provider";
import { AccountLinks } from "@/components/account/account-links";
import { accountStore } from "@/lib/account-store";
import { siteConfig, whatsappLink } from "@/lib/site-config";

/* Línea gris de 1px con ~16px arriba y abajo: el margen negativo compensa el space-y-7 del nav. */
const separatorClass = "-mt-3 mb-4 border-0 border-t border-border";
const rowClass ="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 text-left font-medium transition-colors hover:bg-surface";

function SectionTitle({ children }: { children: string }) {
  return <h3 className="mb-1 px-3 text-xs font-bold uppercase tracking-[.18em] text-primary-strong">{children}</h3>;
}

export function MenuDrawer() {
  const { panel, closePanel, openAccount, customer, notify } = useStore();
  const router = useRouter();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const close = () => closePanel("menu");
  const whatsapp = whatsappLink("Hola, necesito ayuda con un pedido.");

  function logout() {
    accountStore.logout();
    setConfirmLogout(false);
    close();
    router.push("/");
    notify("Cerraste sesión");
  }

  return (
    <>
    <Sheet open={panel === "menu"} onClose={close} title="Menú" side="left">
      <nav aria-label="Menú de la tienda" className="space-y-7">
        <section>
          <SectionTitle>Categorías</SectionTitle>
          <ul>
            {siteConfig.menuCategories.map((c) => (
              <li key={c.slug}>
                <Link href={`/productos?categoria=${encodeURIComponent(c.slug)}`} onClick={close} className={rowClass}>
                  {c.label}
                  <ChevronRight aria-hidden className="size-4 text-muted" />
                </Link>
              </li>
            ))}
            <li>
              <Link href="/productos" onClick={close} className={`${rowClass} text-primary-strong`}>
                Ver todos los productos
                <ChevronRight aria-hidden className="size-4" />
              </Link>
            </li>
          </ul>
        </section>

        <hr className={separatorClass} />

        <section>
          <SectionTitle>Mi cuenta</SectionTitle>
          {customer ? (
            <div className="mb-2 px-3">
              <p className="font-semibold">Hola, {customer.name}</p>
              <p className="truncate text-xs text-muted">{customer.email}</p>
            </div>
          ) : (
            <div className="mb-2 px-3">
              <p className="text-sm text-muted">Crea tu cuenta para dar seguimiento a tu pedido.</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => openAccount("login")} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary px-4 text-sm font-semibold text-primary-strong transition-colors hover:bg-primary-soft">
                  Iniciar sesión
                </button>
                <button type="button" onClick={() => openAccount("register")} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-strong">
                  Crear cuenta
                </button>
              </div>
            </div>
          )}
          <AccountLinks onNavigate={close} />
          {customer && (
            <button type="button" onClick={() => setConfirmLogout(true)} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground/80 transition-colors hover:bg-surface">
              <LogOut aria-hidden className="size-4" /> Cerrar sesión
            </button>
          )}
        </section>

        <hr className={separatorClass} />

        <section>
          <SectionTitle>Ayuda</SectionTitle>
          <ul>
            <li>
              <Link href="/consultar-pedido" onClick={close} className={rowClass}>
                Consultar mi pedido
                <ChevronRight aria-hidden className="size-4 text-muted" />
              </Link>
            </li>
            <li>
              <Link href={siteConfig.helpLinks[0].href} onClick={close} className={rowClass}>
                {siteConfig.helpLinks[0].label}
                <ChevronRight aria-hidden className="size-4 text-muted" />
              </Link>
            </li>
            <li>
              {whatsapp ? (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={rowClass}>
                  Contacto por WhatsApp
                  <ChevronRight aria-hidden className="size-4 text-muted" />
                </a>
              ) : (
                <span className={`${rowClass} text-muted`}>Contacto por WhatsApp (próximamente)</span>
              )}
            </li>
            <li>
              <Link href={siteConfig.helpLinks[1].href} onClick={close} className={rowClass}>
                {siteConfig.helpLinks[1].label}
                <ChevronRight aria-hidden className="size-4 text-muted" />
              </Link>
            </li>
          </ul>
        </section>
      </nav>
    </Sheet>
    <ConfirmDialog open={confirmLogout} title="¿Quieres cerrar sesión?" confirmLabel="Cerrar sesión" onCancel={() => setConfirmLogout(false)} onConfirm={logout} />
    </>
  );
}

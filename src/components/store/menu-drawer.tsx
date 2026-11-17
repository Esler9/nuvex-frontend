"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { useStore } from "@/components/store/store-provider";
import { siteConfig, whatsappLink } from "@/lib/site-config";

const accountItems = ["Mis compras", "Historial de pedidos", "Formas de pago guardadas", "Mis direcciones"];
const rowClass = "flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 text-left font-medium transition-colors hover:bg-surface";

function SectionTitle({ children }: { children: string }) {
  return <h3 className="mb-1 px-3 text-xs font-bold uppercase tracking-[.18em] text-primary-strong">{children}</h3>;
}

export function MenuDrawer() {
  const { panel, closePanel, openPanel, customer } = useStore();
  const close = () => closePanel("menu");
  const whatsapp = whatsappLink("Hola, necesito ayuda con un pedido.");

  return (
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

        <section>
          <SectionTitle>Mi cuenta</SectionTitle>
          {!customer && <p className="mb-2 px-3 text-sm text-muted">Inicia sesión para ver tu información.</p>}
          <ul>
            {accountItems.map((label) => (
              <li key={label}>
                {/* Sin sesión, cada opción lleva al inicio de sesión. */}
                <button type="button" onClick={() => openPanel("account")} className={rowClass}>
                  {label}
                  <ChevronRight aria-hidden className="size-4 text-muted" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <SectionTitle>Ayuda</SectionTitle>
          <ul>
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
  );
}

"use client";

import Link from "next/link";
import { ChevronRight, FileText, Gift, Heart, MapPin, ShoppingBag, Star } from "lucide-react";
import { useStore } from "@/components/store/store-provider";
import { pointsBalance, useAccount } from "@/lib/account-store";
import { siteConfig } from "@/lib/site-config";

const items = [
  { href: "/mi-cuenta/puntos", label: "Puntos NUVEX", Icon: Gift, points: true },
  { href: "/mi-cuenta/compras", label: "Mis compras", Icon: ShoppingBag },
  { href: "/mi-cuenta/opiniones", label: "Mis opiniones", Icon: Star },
  { href: "/mi-cuenta/direcciones", label: "Direcciones de envío", Icon: MapPin },
  { href: "/mi-cuenta/facturacion", label: "Datos de facturación", Icon: FileText },
  { href: "/mi-cuenta/favoritos", label: "Favoritos", Icon: Heart },
] as const;

const rowClass = "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left font-medium transition-colors hover:bg-surface";

/** Opciones de "Mi cuenta". Sin sesión, cada una abre el inicio de sesión. */
export function AccountLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { customer, openPanel } = useStore();
  const account = useAccount();
  const visible = items.filter((i) => !("points" in i) || siteConfig.points.enabled);

  return (
    <ul>
      {visible.map(({ href, label, Icon, ...rest }) => {
        const content = (
          <>
            <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
              <Icon className="size-4" strokeWidth={1.75} />
            </span>
            <span className="flex-1">{label}</span>
            {"points" in rest && customer && <span className="text-sm font-semibold text-primary-strong">{pointsBalance(account)} pts</span>}
            <ChevronRight aria-hidden className="size-4 text-muted" />
          </>
        );
        return (
          <li key={href}>
            {customer ? (
              <Link href={href} onClick={onNavigate} className={rowClass}>
                {content}
              </Link>
            ) : (
              <button type="button" onClick={() => openPanel("account")} className={rowClass}>
                {content}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

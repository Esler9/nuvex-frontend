"use client";

import Link from "next/link";
import { Menu, ShoppingCart, User } from "lucide-react";
import { useStore } from "@/components/store/store-provider";

const iconButton = "relative grid size-11 place-items-center rounded-full text-foreground transition-colors hover:bg-surface hover:text-primary-strong";

export function MenuButton() {
  const { openPanel } = useStore();
  return (
    <button type="button" onClick={() => openPanel("menu")} aria-label="Abrir menú" aria-haspopup="dialog" className={iconButton}>
      <Menu aria-hidden className="size-6" />
    </button>
  );
}

export function AccountButton() {
  const { openPanel, customer } = useStore();
  if (customer) {
    return (
      <Link href="/mi-cuenta" aria-label="Mi cuenta" className={iconButton}>
        <User aria-hidden className="size-6" />
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => openPanel("account")} aria-label="Iniciar sesión o crear cuenta" aria-haspopup="dialog" className={iconButton}>
      <User aria-hidden className="size-6" />
    </button>
  );
}

export function CartButton() {
  const { openPanel, count } = useStore();
  const label = count === 1 ? "Carrito, 1 producto" : `Carrito, ${count} productos`;
  return (
    <button type="button" onClick={() => openPanel("cart")} aria-label={label} aria-haspopup="dialog" className={iconButton}>
      <ShoppingCart aria-hidden className="size-6" />
      {count > 0 && (
        <span aria-hidden className="absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold leading-none text-accent-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

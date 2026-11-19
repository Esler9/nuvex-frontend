"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/facturas", label: "Facturas pendientes" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/promociones", label: "Promociones" },
  { href: "/admin/ajustes", label: "Ajustes" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Panel de administración" className="-mx-1 max-w-full overflow-x-auto no-scrollbar">
      <ul className="flex gap-1 px-1">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors ${active ? "bg-primary-soft text-primary-strong" : "text-muted hover:text-foreground"}`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Panel de administración">
      <ul className="flex gap-1">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <li key={link.href}>
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

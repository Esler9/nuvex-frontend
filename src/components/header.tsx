import Link from "next/link";
import { Search } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { AccountButton, CartButton, MenuButton } from "@/components/store/header-actions";

export function AnnouncementBar() {
  return (
    <div className="bg-accent-soft px-4 py-2 text-center text-xs font-semibold text-accent-text sm:text-sm">
      {siteConfig.announcement}
    </div>
  );
}

function SearchForm({ id, className = "" }: { id: string; className?: string }) {
  return (
    <form action="/productos" role="search" className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        Buscar productos
      </label>
      <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
      <input
        id={id}
        name="q"
        type="search"
        maxLength={100}
        placeholder="Buscar productos..."
        className="min-h-11 w-full rounded-lg border border-border bg-surface pl-12 pr-4 text-base text-foreground placeholder:text-muted focus:border-primary focus:bg-card"
      />
    </form>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="container-shell flex h-16 items-center gap-1 md:gap-6">
        <div className="flex items-center gap-1">
          {/* Placeholder del logo: reemplázalo por la imagen oficial de la marca. */}
          <Link href="/" className="flex min-h-11 items-center pr-1 text-2xl font-black tracking-tight text-foreground" aria-label={`${siteConfig.name}, inicio`}>
            {siteConfig.name.toUpperCase()}
            <span className="text-primary">.</span>
          </Link>
          <MenuButton />
        </div>
        <SearchForm id="search-desktop" className="mx-auto hidden w-full max-w-xl md:block" />
        <div className="ml-auto flex items-center md:ml-0">
          <AccountButton />
          <CartButton />
        </div>
      </div>
      <div className="container-shell pb-3 md:hidden">
        <SearchForm id="search-mobile" />
      </div>
    </header>
  );
}

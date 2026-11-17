"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Cable, ChevronDown, Headphones, MemoryStick, Mic, PlugZap, ShieldCheck, Sparkles, TabletSmartphone, Usb } from "lucide-react";
import type { DiscoverCategory } from "@/types/content";

const icons = {
  usb: Usb,
  otg: Cable,
  glass: ShieldCheck,
  mic: Mic,
  ram: MemoryStick,
  headphones: Headphones,
  charger: PlugZap,
  stand: TabletSmartphone,
};

type Props = { title: string; subtitle: string; categories: DiscoverCategory[] };

/** Botón llamativo que despliega categorías extra en círculos con su imagen. */
export function DiscoverCategories({ title, subtitle, categories }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <section aria-label={title} className="rounded-xl bg-primary-soft p-4 sm:p-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="group flex w-full items-center gap-3 text-left sm:gap-4"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-strong text-white shadow-card transition-transform motion-safe:group-hover:rotate-12 sm:size-14">
          <Sparkles aria-hidden className="size-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-black tracking-tight sm:text-xl">{title}</span>
          <span className="block text-sm text-muted">{subtitle}</span>
        </span>
        <span className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg bg-card px-3 text-sm font-semibold text-primary-strong shadow-card">
          <span className="hidden sm:inline">{open ? "Ocultar" : "Ver categorías"}</span>
          <ChevronDown aria-hidden className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      <div id={panelId} hidden={!open}>
        <ul className="mt-6 grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-6 lg:grid-cols-8">
          {categories.map((c) => {
            const Icon = icons[c.icon];
            return (
              <li key={c.slug} className="discover-item">
                <Link href={`/productos?categoria=${encodeURIComponent(c.slug)}`} className="group flex flex-col items-center gap-2 rounded-lg text-center">
                  <span className="grid size-16 place-items-center overflow-hidden rounded-full border-2 border-card bg-card shadow-card ring-2 ring-primary/25 transition-all group-hover:ring-primary sm:size-20">
                    {c.image ? (
                      <img src={c.image.src} alt="" width={80} height={80} loading="lazy" decoding="async" className="size-full object-cover" />
                    ) : (
                      <Icon aria-hidden className="size-7 text-accent sm:size-8" strokeWidth={1.5} />
                    )}
                  </span>
                  <span className="text-xs font-medium leading-tight text-foreground group-hover:text-primary-strong sm:text-sm">{c.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

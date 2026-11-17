"use client";

import { useState } from "react";
import { Check, Facebook, Link2, Share2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/brand-icons";

const tones = { outline: "bg-card border border-border", muted: "bg-surface" };
const item = "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium hover:bg-surface";

/** Compartir por WhatsApp, Facebook o copiar enlace. */
export function ShareButton({ title, tone }: { title: string; tone: keyof typeof tones }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function openWindow(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  function copy() {
    navigator.clipboard
      ?.writeText(window.location.href)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => {
          setCopied(false);
          setOpen(false);
        }, 1500);
      })
      .catch(() => {});
  }

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Compartir"
        aria-expanded={open}
        aria-haspopup="menu"
        className={`grid size-11 place-items-center rounded-full text-foreground transition-transform hover:scale-105 ${tones[tone]}`}
      >
        <Share2 aria-hidden className="size-5" strokeWidth={1.75} />
      </button>
      {open && (
        <div role="menu" className="absolute right-full top-0 mr-2 w-52 rounded-xl border border-border bg-card p-1 shadow-card-hover">
          <button role="menuitem" type="button" className={item} onClick={() => openWindow(`https://wa.me/?text=${encodeURIComponent(`${title} ${window.location.href}`)}`)}>
            <WhatsAppIcon className="size-5 text-whatsapp" /> WhatsApp
          </button>
          <button role="menuitem" type="button" className={item} onClick={() => openWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`)}>
            <Facebook aria-hidden className="size-5 text-primary-strong" /> Facebook
          </button>
          <button role="menuitem" type="button" className={item} onClick={copy}>
            {copied ? <Check aria-hidden className="size-5 text-success" /> : <Link2 aria-hidden className="size-5 text-muted" />}
            <span aria-live="polite">{copied ? "¡Enlace copiado!" : "Copiar enlace"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { Menu } from "lucide-react";

export function BackToTopButton() {
  return (
    <button
      type="button"
      onClick={() => {
        const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
        document.getElementById("main-content")?.focus({ preventScroll: true });
      }}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary-strong"
    >
      <Menu aria-hidden className="size-5" />
      Volver al inicio
    </button>
  );
}

/** Clases compartidas, tomadas de los botones, campos y tarjetas que ya usa el sitio. */
export const ui = {
  btnPrimary:
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent px-6 font-bold text-accent-foreground transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-accent/50 disabled:text-accent-foreground/70",
  btnOutline:
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-primary px-6 font-semibold text-primary-strong transition-colors hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50",
  btnBlue: "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary-strong px-6 font-bold text-white transition-colors hover:bg-navy",
  btnGhost: "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface",
  input:
    "mt-1.5 block min-h-12 w-full rounded-xl border border-border bg-card px-4 text-base text-foreground placeholder:text-muted/70 focus:border-primary aria-[invalid=true]:border-danger",
  card: "rounded-xl border border-border bg-card p-4 shadow-card sm:p-5",
  eyebrow: "text-xs font-bold uppercase tracking-[.18em] text-primary-strong",
  pageTitle: "text-2xl font-bold sm:text-3xl",
};

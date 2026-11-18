export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="grid gap-3">
      <span className="sr-only">Cargando…</span>
      <div className="h-8 w-48 rounded-lg bg-border/60 motion-safe:animate-pulse" />
      {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-14 rounded-xl bg-border/40 motion-safe:animate-pulse" />)}
    </div>
  );
}

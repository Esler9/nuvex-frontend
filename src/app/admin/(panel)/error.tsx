"use client";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-danger/30 bg-card p-8 text-center">
      <h1 className="text-lg font-semibold">No se pudo cargar esta sección</h1>
      <p className="mt-2 text-sm text-muted">Revisa la conexión con WooCommerce e intenta de nuevo.</p>
      <button type="button" onClick={reset} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary-strong px-5 text-sm font-semibold text-white hover:bg-navy">Reintentar</button>
    </div>
  );
}

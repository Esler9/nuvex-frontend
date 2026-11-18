import type { Metadata } from "next";
import Link from "next/link";
import { Alert, inputClass } from "@/components/admin/fields";
import { PageHeader, StatusPill } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/session";
import { AdminApiError, isWooAdminConfigured, listProducts } from "@/lib/admin/woo-admin";
import { STATUSES, oneOf } from "@/lib/admin/validation";
import { statusLabel, stockLabel } from "@/lib/admin/labels";
import { formatDecimalMoney } from "@/lib/format";
import type { Paginated, WcAdminProduct } from "@/types/admin";

export const metadata: Metadata = { title: "Productos" };

type Search = { q?: string; estado?: string; pagina?: string; guardado?: string; eliminado?: string };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;
  const q = (params.q || "").trim().slice(0, 100);
  const status = oneOf(params.estado || "any", ["any", ...STATUSES] as const, "any");
  const page = Math.max(1, Number(params.pagina) || 1);

  let result: Paginated<WcAdminProduct> | null = null;
  let error: string | null = null;
  if (isWooAdminConfigured()) {
    try {
      result = await listProducts({ page, search: q, status });
    } catch (e) {
      error = e instanceof AdminApiError ? e.message : "No se pudieron cargar los productos.";
    }
  }

  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status !== "any") sp.set("estado", status);
    if (p > 1) sp.set("pagina", String(p));
    const s = sp.toString();
    return `/admin/productos${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Productos" description={result ? `${result.total} producto${result.total === 1 ? "" : "s"}` : undefined} action={{ href: "/admin/productos/nuevo", label: "Nuevo producto" }} />
      <div className="grid gap-4">
        {params.guardado && <Alert tone="success">Producto guardado.</Alert>}
        {params.eliminado && <Alert tone="success">Producto enviado a la papelera. Puedes restaurarlo desde WooCommerce.</Alert>}
        {error && <Alert>{error}</Alert>}

        <form role="search" className="flex flex-col gap-3 sm:flex-row" action="/admin/productos">
          <label htmlFor="q" className="sr-only">Buscar productos</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Buscar por nombre o SKU" className={inputClass} />
          <label htmlFor="estado" className="sr-only">Estado</label>
          <select id="estado" name="estado" defaultValue={status} className={`${inputClass} sm:max-w-52`}>
            <option value="any">Todos los estados</option>
            {STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
          </select>
          <button type="submit" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-border bg-card px-5 text-sm font-medium hover:bg-surface">Filtrar</button>
        </form>

        {result && (result.items.length ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Listado de productos</caption>
              <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Producto</th>
                  <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Precio</th>
                  <th scope="col" className="hidden px-4 py-3 font-medium lg:table-cell">Existencias</th>
                  <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.items.map((p) => (
                  <tr key={p.id} className="hover:bg-surface/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-image-well">
                          {p.images[0] && <img src={p.images[0].src} alt="" width={48} height={48} loading="lazy" className="size-full object-contain" />}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/productos/${p.id}`} className="font-medium text-foreground hover:text-primary-strong hover:underline">{p.name || "(sin nombre)"}</Link>
                          <p className="truncate text-xs text-muted">
                            {p.sku ? `SKU ${p.sku}` : "Sin SKU"}
                            {p.type !== "simple" && ` · ${p.type === "variable" ? "Variable" : p.type}`}
                            <span className="md:hidden"> · {formatDecimalMoney(p.price)}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {formatDecimalMoney(p.price)}
                      {p.sale_price && <span className="block text-xs text-muted line-through">{formatDecimalMoney(p.regular_price)}</span>}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <StatusPill tone={p.stock_status === "outofstock" ? "danger" : "neutral"}>{stockLabel(p)}</StatusPill>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill tone={p.status === "publish" ? "success" : "neutral"}>{statusLabel[p.status] ?? p.status}</StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="font-semibold">{q || status !== "any" ? "Ningún producto coincide con el filtro" : "Aún no hay productos"}</p>
            <p className="mt-1 text-sm text-muted">{q || status !== "any" ? "Prueba con otra búsqueda." : "Crea el primero para que aparezca en la tienda."}</p>
          </div>
        ))}

        {result && result.totalPages > 1 && (
          <nav aria-label="Paginación" className="flex items-center justify-between text-sm">
            {page > 1 ? <Link href={pageHref(page - 1)} className="rounded-lg border border-border bg-card px-4 py-2 hover:bg-surface">← Anterior</Link> : <span />}
            <span className="text-muted">Página {page} de {result.totalPages}</span>
            {page < result.totalPages ? <Link href={pageHref(page + 1)} className="rounded-lg border border-border bg-card px-4 py-2 hover:bg-surface">Siguiente →</Link> : <span />}
          </nav>
        )}
      </div>
    </>
  );
}

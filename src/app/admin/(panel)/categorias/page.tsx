import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/admin/fields";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/session";
import { AdminApiError, isWooAdminConfigured, listCategories } from "@/lib/admin/woo-admin";
import type { WcAdminCategory } from "@/types/admin";

export const metadata: Metadata = { title: "Categorías" };

/** Ordena como árbol: cada categoría seguida de sus subcategorías. */
function asTree(items: WcAdminCategory[]) {
  const ids = new Set(items.map((c) => c.id));
  const out: Array<{ category: WcAdminCategory; depth: number }> = [];
  const visit = (parent: number, depth: number) => {
    for (const c of items.filter((i) => i.parent === parent)) {
      out.push({ category: c, depth });
      if (depth < 5) visit(c.id, depth + 1);
    }
  };
  visit(0, 0);
  // Huérfanas (superior inexistente) al final.
  for (const c of items) if (c.parent && !ids.has(c.parent)) out.push({ category: c, depth: 0 });
  return out;
}

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ guardado?: string; eliminado?: string }> }) {
  await requireAdmin();
  const { guardado, eliminado } = await searchParams;

  let categories: WcAdminCategory[] | null = null;
  let error: string | null = null;
  if (isWooAdminConfigured()) {
    try {
      categories = await listCategories();
    } catch (e) {
      error = e instanceof AdminApiError ? e.message : "No se pudieron cargar las categorías.";
    }
  }

  return (
    <>
      <PageHeader title="Categorías" description={categories ? `${categories.length} categoría${categories.length === 1 ? "" : "s"}` : undefined} action={{ href: "/admin/categorias/nueva", label: "Nueva categoría" }} />
      <div className="grid gap-4">
        {guardado && <Alert tone="success">Categoría guardada.</Alert>}
        {eliminado && <Alert tone="success">Categoría eliminada.</Alert>}
        {error && <Alert>{error}</Alert>}
        {categories && (categories.length ? (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {asTree(categories).map(({ category: c, depth }) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface/60" style={{ paddingLeft: `${1 + depth * 1.5}rem` }}>
                <div className="size-10 shrink-0 overflow-hidden rounded-full bg-image-well">
                  {c.image && <img src={c.image.src} alt="" width={40} height={40} loading="lazy" className="size-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/categorias/${c.id}`} className="font-medium hover:text-primary-strong hover:underline">{c.name}</Link>
                  <p className="truncate text-xs text-muted">/{c.slug}</p>
                </div>
                <span className="shrink-0 text-xs text-muted">{c.count} producto{c.count === 1 ? "" : "s"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="font-semibold">Aún no hay categorías</p>
            <p className="mt-1 text-sm text-muted">Crea la primera para organizar el catálogo.</p>
          </div>
        ))}
      </div>
    </>
  );
}

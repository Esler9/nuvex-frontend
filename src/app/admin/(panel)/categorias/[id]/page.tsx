import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deleteCategoryAction } from "@/app/admin/actions";
import { CategoryForm } from "@/components/admin/category-form";
import { Alert, ConfirmButton } from "@/components/admin/fields";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/session";
import { positiveId } from "@/lib/admin/validation";
import { AdminApiError, getCategory, isMediaUploadConfigured, listCategories } from "@/lib/admin/woo-admin";

export const metadata: Metadata = { title: "Editar categoría" };

export default async function EditCategoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const id = positiveId((await params).id);
  if (!id) notFound();
  const { error } = await searchParams;

  const category = await getCategory(id).catch((e: unknown) => {
    if (e instanceof AdminApiError && e.status === 404) return null;
    throw e;
  });
  if (!category) notFound();
  const categories = await listCategories();

  return (
    <>
      <PageHeader title={category.name} description={`${category.count} producto${category.count === 1 ? "" : "s"} · ID ${category.id}`} back={{ href: "/admin/categorias", label: "Categorías" }} />
      {error && <div className="mb-6"><Alert>{error.slice(0, 300)}</Alert></div>}
      <CategoryForm category={category} categories={categories} mediaEnabled={isMediaUploadConfigured()} />

      <section aria-labelledby="zona-peligro" className="mt-10 rounded-xl border border-danger/30 bg-card p-4 sm:p-6">
        <h2 id="zona-peligro" className="text-base font-semibold">Eliminar categoría</h2>
        <p className="mt-1 text-sm text-muted">
          Se elimina de forma permanente (WooCommerce no tiene papelera para categorías). Los productos no se borran; solo dejan de pertenecer a esta categoría.
          {category.count > 0 && ` Tiene ${category.count} producto${category.count === 1 ? "" : "s"}.`}
        </p>
        <form action={deleteCategoryAction} className="mt-4">
          <input type="hidden" name="id" value={category.id} />
          <ConfirmButton message={`¿Eliminar la categoría "${category.name}" de forma permanente?`}>Eliminar categoría</ConfirmButton>
        </form>
      </section>
    </>
  );
}

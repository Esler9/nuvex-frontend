import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { trashProductAction } from "@/app/admin/actions";
import { Alert, ConfirmButton } from "@/components/admin/fields";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin/session";
import { positiveId } from "@/lib/admin/validation";
import { AdminApiError, getProduct, isMediaUploadConfigured, listCategories } from "@/lib/admin/woo-admin";

export const metadata: Metadata = { title: "Editar producto" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ guardado?: string; error?: string }> }) {
  await requireAdmin();
  const id = positiveId((await params).id);
  if (!id) notFound();
  const { guardado, error } = await searchParams;

  const product = await getProduct(id).catch((e: unknown) => {
    if (e instanceof AdminApiError && e.status === 404) return null;
    throw e;
  });
  if (!product) notFound();
  const categories = await listCategories();

  return (
    <>
      <PageHeader title={product.name || "Producto sin nombre"} description={`ID ${product.id}`} back={{ href: "/admin/productos", label: "Productos" }} />
      <div className="mb-6 grid gap-3">
        {guardado && <Alert tone="success">Cambios guardados en WooCommerce.</Alert>}
        {error && <Alert>{error.slice(0, 300)}</Alert>}
        {product.status === "trash" && <Alert tone="info">Este producto está en la papelera. Restáuralo desde WooCommerce para editarlo.</Alert>}
        {product.status === "publish" && (
          <p className="text-sm">
            <Link href={`/productos/${product.slug}`} className="font-medium text-primary-strong underline">Ver en la tienda</Link>
            <span className="text-muted"> · la tienda puede tardar unos segundos en reflejar cambios.</span>
          </p>
        )}
      </div>

      <ProductForm product={product} categories={categories} mediaEnabled={isMediaUploadConfigured()} />

      {product.status !== "trash" && (
        <section aria-labelledby="zona-peligro" className="mt-10 rounded-xl border border-danger/30 bg-card p-4 sm:p-6">
          <h2 id="zona-peligro" className="text-base font-semibold">Enviar a la papelera</h2>
          <p className="mt-1 text-sm text-muted">Deja de mostrarse en la tienda. Se puede restaurar desde WooCommerce.</p>
          <form action={trashProductAction} className="mt-4">
            <input type="hidden" name="id" value={product.id} />
            <ConfirmButton message={`¿Enviar "${product.name}" a la papelera?`}>Enviar a la papelera</ConfirmButton>
          </form>
        </section>
      )}
    </>
  );
}

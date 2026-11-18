import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin/session";
import { isMediaUploadConfigured, isWooAdminConfigured, listCategories } from "@/lib/admin/woo-admin";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NewProductPage() {
  await requireAdmin();
  const categories = isWooAdminConfigured() ? await listCategories() : [];
  return (
    <>
      <PageHeader title="Nuevo producto" description="Se crea como producto simple. Los productos variables se configuran en WooCommerce." back={{ href: "/admin/productos", label: "Productos" }} />
      <ProductForm categories={categories} mediaEnabled={isMediaUploadConfigured()} />
    </>
  );
}

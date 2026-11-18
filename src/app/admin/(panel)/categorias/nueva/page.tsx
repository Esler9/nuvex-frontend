import type { Metadata } from "next";
import { CategoryForm } from "@/components/admin/category-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/session";
import { isMediaUploadConfigured, isWooAdminConfigured, listCategories } from "@/lib/admin/woo-admin";

export const metadata: Metadata = { title: "Nueva categoría" };

export default async function NewCategoryPage() {
  await requireAdmin();
  const categories = isWooAdminConfigured() ? await listCategories() : [];
  return (
    <>
      <PageHeader title="Nueva categoría" back={{ href: "/admin/categorias", label: "Categorías" }} />
      <CategoryForm categories={categories} mediaEnabled={isMediaUploadConfigured()} />
    </>
  );
}

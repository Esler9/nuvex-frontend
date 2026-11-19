import type { Metadata } from "next";
import { catalogCategories } from "@/app/admin/order-actions";
import { PageHeader } from "@/components/admin/page-header";
import { PromotionForm } from "@/components/admin/promotion-form";
import { requireAdmin } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Nueva promoción" };

export default async function NewPromotionPage() {
  await requireAdmin();
  const categories = await catalogCategories();
  return (
    <>
      <PageHeader title="Nueva promoción" back={{ href: "/admin/promociones", label: "Promociones" }} />
      <PromotionForm categories={categories} initialProducts={[]} />
    </>
  );
}

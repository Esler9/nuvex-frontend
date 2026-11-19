import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogCategories } from "@/app/admin/order-actions";
import { PageHeader } from "@/components/admin/page-header";
import { PromotionForm } from "@/components/admin/promotion-form";
import { requireAdmin } from "@/lib/admin/session";
import { isDemoCatalog } from "@/lib/api";
import { sampleProducts } from "@/lib/sample-catalog";
import { getPromotion } from "@/lib/server/admin-store";

export const metadata: Metadata = { title: "Editar promoción" };

export default async function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const promotion = await getPromotion((await params).id.slice(0, 40));
  if (!promotion) notFound();
  const categories = await catalogCategories();
  const initialProducts = promotion.productIds.map((id) => ({ id, name: (isDemoCatalog ? sampleProducts.find((p) => p.id === id)?.name : undefined) ?? `Producto #${id}` }));
  return (
    <>
      <PageHeader title={promotion.name} back={{ href: "/admin/promociones", label: "Promociones" }} />
      <PromotionForm promotion={promotion} categories={categories} initialProducts={initialProducts} />
    </>
  );
}

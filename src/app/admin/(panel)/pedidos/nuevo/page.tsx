import type { Metadata } from "next";
import { ManualOrderForm } from "@/components/admin/manual-order-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/session";
import { getStoreSettings } from "@/lib/server/admin-store";

export const metadata: Metadata = { title: "Crear pedido manual" };

export default async function NewManualOrderPage() {
  await requireAdmin();
  const settings = await getStoreSettings();
  return (
    <>
      <PageHeader title="Crear pedido manual" description="Ventas por WhatsApp, en tienda o por teléfono." back={{ href: "/admin/pedidos", label: "Pedidos" }} />
      <ManualOrderForm cfLimit={settings.cfLimit} />
    </>
  );
}

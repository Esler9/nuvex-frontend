import type { Metadata } from "next";
import { Alert } from "@/components/admin/fields";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdmin } from "@/lib/admin/session";
import { getStoreSettings } from "@/lib/server/admin-store";

export const metadata: Metadata = { title: "Ajustes" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ guardado?: string }> }) {
  await requireAdmin();
  const [settings, sp] = await Promise.all([getStoreSettings(), searchParams]);
  return (
    <>
      <PageHeader title="Ajustes" />
      <div className="grid max-w-xl gap-4">
        {sp.guardado && <Alert tone="success">Ajustes guardados.</Alert>}
        <SettingsForm cfLimit={settings.cfLimit} />
      </div>
    </>
  );
}

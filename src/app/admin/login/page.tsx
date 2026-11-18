import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { Alert } from "@/components/admin/fields";
import { getSession, isAdminConfigured } from "@/lib/admin/session";
import { safeAdminPath } from "@/lib/admin/validation";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeAdminPath(next);
  if (await getSession()) redirect(target);
  const configured = isAdminConfigured();

  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <p className="text-sm font-semibold text-primary-strong">{siteConfig.name}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Panel de administración</h1>
        <p className="mt-2 text-sm text-muted">Gestiona productos y categorías de WooCommerce.</p>
        <div className="mt-6">
          {configured ? (
            <LoginForm next={target} />
          ) : (
            <Alert tone="info">El panel está deshabilitado: faltan ADMIN_EMAIL, ADMIN_PASSWORD_HASH o ADMIN_SESSION_SECRET (mínimo 32 caracteres) en el servidor.</Alert>
          )}
        </div>
      </div>
    </main>
  );
}

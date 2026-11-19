import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { Alert } from "@/components/admin/fields";
import { requireAdmin } from "@/lib/admin/session";
import { isWooAdminConfigured } from "@/lib/admin/woo-admin";
import { siteConfig } from "@/lib/site-config";

export default async function PanelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const email = await requireAdmin();
  return (
    <>
      <a href="#admin-content" className="sr-only z-50 rounded-lg bg-primary-strong px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="container-shell flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/admin/pedidos" className="text-sm font-bold">{siteConfig.name} <span className="font-normal text-muted">Admin</span></Link>
            <AdminNav />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted md:inline">{email}</span>
            <Link href="/" className="text-muted hover:text-foreground">Ver tienda</Link>
            <form action={logoutAction}>
              <button type="submit" className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 font-medium hover:bg-surface">Salir</button>
            </form>
          </div>
        </div>
      </header>
      <main id="admin-content" tabIndex={-1} className="container-shell py-6 outline-none sm:py-8">
        {!isWooAdminConfigured() && (
          <div className="mb-6">
            <Alert tone="info">WooCommerce no está conectado: configura WOOCOMMERCE_URL (https), WC_CONSUMER_KEY y WC_CONSUMER_SECRET en el servidor.</Alert>
          </div>
        )}
        {children}
      </main>
    </>
  );
}

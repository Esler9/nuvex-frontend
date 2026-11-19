import { AnnouncementBar, Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";
import { StoreProvider } from "@/components/store/store-provider";
import { MenuDrawer } from "@/components/store/menu-drawer";
import { CartDrawer } from "@/components/store/cart-drawer";
import { AccountDialog } from "@/components/store/account-dialog";
import { FavoritesDrawer } from "@/components/store/favorites-drawer";
import { ScrollMemory } from "@/components/page-transition";
import { isDemoCatalog } from "@/lib/api";
import { getActivePromotions, getSettings } from "@/lib/server/orders";

export default async function StoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [promotions, settings] = await Promise.all([getActivePromotions(), getSettings()]);
  return (
    <StoreProvider demo={isDemoCatalog} promotions={promotions} cfLimit={settings.cfLimit}>
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-primary-strong px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Saltar al contenido
      </a>
      {/* El encabezado no participa en la transición entre páginas: se queda fijo. */}
      <div className="sticky top-0 z-40" style={{ viewTransitionName: "site-header" }}>
        <AnnouncementBar />
        <Header />
      </div>
      <main id="main-content" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter />
      <MenuDrawer />
      <CartDrawer />
      <AccountDialog />
      <FavoritesDrawer />
      <ScrollMemory />
    </StoreProvider>
  );
}

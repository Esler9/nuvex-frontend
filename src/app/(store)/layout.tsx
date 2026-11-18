import { AnnouncementBar, Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";
import { StoreProvider } from "@/components/store/store-provider";
import { MenuDrawer } from "@/components/store/menu-drawer";
import { CartDrawer } from "@/components/store/cart-drawer";
import { AccountDialog } from "@/components/store/account-dialog";
import { FavoritesDrawer } from "@/components/store/favorites-drawer";
import { isDemoCatalog } from "@/lib/api";

export default function StoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <StoreProvider demo={isDemoCatalog}>
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-primary-strong px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Saltar al contenido
      </a>
      <div className="sticky top-0 z-40">
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
    </StoreProvider>
  );
}

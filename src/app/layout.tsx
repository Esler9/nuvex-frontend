import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AnnouncementBar, Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";
import { StoreProvider } from "@/components/store/store-provider";
import { MenuDrawer } from "@/components/store/menu-drawer";
import { CartDrawer } from "@/components/store/cart-drawer";
import { AccountDialog } from "@/components/store/account-dialog";
import { FavoritesDrawer } from "@/components/store/favorites-drawer";
import { siteConfig } from "@/lib/site-config";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${siteConfig.name} | Accesorios para celulares en Guatemala`, template: `%s | ${siteConfig.name}` },
  description: "Protectores, fundas, cargadores, cables, adaptadores y memorias para iPhone y Samsung. Envíos a todo Guatemala.",
  openGraph: { type: "website", locale: "es_GT", siteName: siteConfig.name },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-GT" className={inter.variable}>
      <body className="min-h-screen">
        <StoreProvider>
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
      </body>
    </html>
  );
}

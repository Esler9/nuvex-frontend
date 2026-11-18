import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
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
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

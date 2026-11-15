import type {Metadata} from "next";
import "./globals.css";
import {Header} from "@/components/header";
const siteUrl=process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000";
export const metadata:Metadata={metadataBase:new URL(siteUrl),title:{default:"Nuvex | Tecnología que inspira",template:"%s | Nuvex"},description:"Descubre productos y novedades en Nuvex.",openGraph:{type:"website",locale:"es_GT",siteName:"Nuvex"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="es"><body className="min-h-screen"><Header/><main>{children}</main><footer className="mt-24 border-t border-white/10 py-9 text-center text-xs text-slate-500">© {new Date().getFullYear()} Nuvex · Headless commerce</footer></body></html>}

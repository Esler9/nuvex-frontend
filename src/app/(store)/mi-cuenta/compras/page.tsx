import type { Metadata } from "next";
import { OrdersPage } from "@/components/account/account-pages";

export const metadata: Metadata = { title: "Mis compras", robots: { index: false, follow: false } };

export default function Page() {
  return <OrdersPage />;
}

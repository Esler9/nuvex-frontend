import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { OrdersPage } from "@/components/account/account-pages";

export const metadata: Metadata = { title: "Mis compras", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <PageTransition>
      <OrdersPage />
    </PageTransition>
  );
}

import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { BillingPage } from "@/components/account/account-pages";

export const metadata: Metadata = { title: "Datos de facturación", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <PageTransition>
      <BillingPage />
    </PageTransition>
  );
}

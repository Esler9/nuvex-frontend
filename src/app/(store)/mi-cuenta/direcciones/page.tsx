import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { AddressesPage } from "@/components/account/account-pages";

export const metadata: Metadata = { title: "Direcciones de envío", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <PageTransition>
      <AddressesPage />
    </PageTransition>
  );
}

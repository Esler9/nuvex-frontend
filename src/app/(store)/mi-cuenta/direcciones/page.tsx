import type { Metadata } from "next";
import { AddressesPage } from "@/components/account/account-pages";

export const metadata: Metadata = { title: "Direcciones de envío", robots: { index: false, follow: false } };

export default function Page() {
  return <AddressesPage />;
}

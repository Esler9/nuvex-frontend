import type { Metadata } from "next";
import { AccountHome } from "@/components/account/account-home";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false, follow: false } };

export default function Page() {
  return <AccountHome />;
}

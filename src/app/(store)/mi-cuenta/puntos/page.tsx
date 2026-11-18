import type { Metadata } from "next";
import { PointsPage } from "@/components/account/account-pages";

export const metadata: Metadata = { title: "Puntos NUVEX", robots: { index: false, follow: false } };

export default function Page() {
  return <PointsPage />;
}

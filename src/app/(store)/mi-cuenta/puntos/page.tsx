import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { PointsPage } from "@/components/account/account-pages";

export const metadata: Metadata = { title: "Puntos NUVEX", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <PageTransition>
      <PointsPage />
    </PageTransition>
  );
}

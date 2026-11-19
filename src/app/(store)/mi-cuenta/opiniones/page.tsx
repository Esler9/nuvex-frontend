import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { ReviewsPage } from "@/components/account/account-pages";

export const metadata: Metadata = { title: "Mis opiniones", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <PageTransition>
      <ReviewsPage />
    </PageTransition>
  );
}

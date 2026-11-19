import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { FavoritesPage } from "@/components/account/account-pages";

export const metadata: Metadata = { title: "Favoritos", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <PageTransition>
      <FavoritesPage />
    </PageTransition>
  );
}

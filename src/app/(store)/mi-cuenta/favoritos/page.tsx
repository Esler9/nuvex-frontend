import type { Metadata } from "next";
import { FavoritesPage } from "@/components/account/account-pages";

export const metadata: Metadata = { title: "Favoritos", robots: { index: false, follow: false } };

export default function Page() {
  return <FavoritesPage />;
}

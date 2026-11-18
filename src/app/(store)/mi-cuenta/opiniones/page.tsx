import type { Metadata } from "next";
import { ReviewsPage } from "@/components/account/account-pages";

export const metadata: Metadata = { title: "Mis opiniones", robots: { index: false, follow: false } };

export default function Page() {
  return <ReviewsPage />;
}

import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { OrderPage } from "@/components/account/account-pages";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Compra #${decodeURIComponent(id).slice(0, 20)}`, robots: { index: false, follow: false } };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PageTransition kind="detail">
      <OrderPage id={decodeURIComponent(id).slice(0, 20)} />
    </PageTransition>
  );
}

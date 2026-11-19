import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, PackageSearch } from "lucide-react";
import { PageTransition } from "@/components/page-transition";
import { OrderDetail } from "@/components/account/order-detail";
import { ui } from "@/components/ui/styles";
import { getOrderForToken } from "@/lib/server/orders";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string | string[] }> };

export const metadata: Metadata = { title: "Mi pedido", robots: { index: false, follow: false }, referrer: "no-referrer" };

/** "Ver mi pedido": detalle de la compra sin iniciar sesión, con el enlace secreto del correo. */
export default async function GuestOrderPage({ params, searchParams }: Props) {
  const id = decodeURIComponent((await params).id).slice(0, 20);
  const raw = (await searchParams).t;
  const token = (Array.isArray(raw) ? raw[0] : raw)?.slice(0, 100) ?? "";
  const order = token ? await getOrderForToken(id, token) : null;

  return (
    <PageTransition kind="detail">
      <div className="container-shell max-w-3xl py-6 sm:py-8">
        <Link href="/consultar-pedido" className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-primary-strong hover:bg-primary-soft">
          <ChevronLeft aria-hidden className="size-4" /> Consultar mi pedido
        </Link>
        <h1 className={`${ui.pageTitle} mt-2`}>Detalle de compra</h1>
        <div className="mt-5">
          {order ? (
            <OrderDetail orderId={order.id} order={order} />
          ) : (
            <div className="flex flex-col items-center rounded-xl border border-border bg-card px-6 py-12 text-center">
              <PackageSearch aria-hidden className="size-12 text-primary" strokeWidth={1.5} />
              <p className="mt-4 text-lg font-semibold">No pudimos abrir este pedido</p>
              <p className="mt-1 max-w-xs text-sm text-muted">El enlace no es válido o está incompleto. Consulta tu pedido con tu número de compra y correo.</p>
              <Link href="/consultar-pedido" className={`${ui.btnOutline} mt-6`}>
                Consultar mi pedido
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

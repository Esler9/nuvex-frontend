"use client";

import { AccountShell } from "@/components/account/account-shell";
import { OrdersList } from "@/components/account/orders-list";
import { OrderDetail } from "@/components/account/order-detail";
import { PointsView } from "@/components/account/points-view";
import { ReviewsView } from "@/components/account/reviews-view";
import { AddressesView } from "@/components/account/addresses-view";
import { BillingView } from "@/components/account/billing-view";
import { FavoritesGrid } from "@/components/account/favorites-grid";

/** Páginas de Mi cuenta: los datos viven en el dispositivo, por eso se renderizan en el cliente. */
export const OrdersPage = () => <AccountShell title="Mis compras">{(a) => <OrdersList orders={a.orders} />}</AccountShell>;

export const OrderPage = ({ id }: { id: string }) => (
  <AccountShell title="Detalle de compra" back={{ href: "/mi-cuenta/compras", label: "Mis compras" }}>
    {(a) => <OrderDetail account={a} orderId={id} />}
  </AccountShell>
);

export const PointsPage = () => <AccountShell title="Puntos NUVEX">{(a) => <PointsView account={a} />}</AccountShell>;
export const ReviewsPage = () => <AccountShell title="Mis opiniones">{(a) => <ReviewsView account={a} />}</AccountShell>;
export const AddressesPage = () => <AccountShell title="Direcciones de envío">{(a) => <AddressesView account={a} />}</AccountShell>;
export const BillingPage = () => <AccountShell title="Datos de facturación">{(a) => <BillingView account={a} />}</AccountShell>;
export const FavoritesPage = () => <AccountShell title="Favoritos">{() => <FavoritesGrid />}</AccountShell>;

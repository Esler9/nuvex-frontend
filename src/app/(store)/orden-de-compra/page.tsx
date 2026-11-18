import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";

export const metadata: Metadata = {
  title: "Orden de compra",
  description: "Revisa tu carrito, ingresa tus datos de envío y sube tu comprobante de pago.",
  alternates: { canonical: "/orden-de-compra" },
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <div className="border-b border-border bg-card">
        <div className="container-shell py-4">
          <h1 className="text-xl font-bold sm:text-2xl">Orden de compra</h1>
        </div>
      </div>
      <CheckoutFlow />
    </>
  );
}

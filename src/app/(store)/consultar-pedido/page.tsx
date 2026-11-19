import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { LookupForm } from "@/components/lookup-form";
import { ui } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Consultar mi pedido",
  description: "Consulta el estado de tu compra, la guía de Cargo Expreso y tu factura con tu número de compra y correo.",
  alternates: { canonical: "/consultar-pedido" },
  robots: { index: false, follow: true },
};

export default function LookupPage() {
  return (
    <PageTransition>
      <div className="container-shell max-w-xl py-8 sm:py-12">
        <h1 className={ui.pageTitle}>Consultar mi pedido</h1>
        <p className="mt-2 text-sm text-muted">Escribe tu número de compra y el correo con el que compraste. No necesitas iniciar sesión.</p>
        <div className={`${ui.card} mt-6`}>
          <LookupForm />
        </div>
      </div>
    </PageTransition>
  );
}

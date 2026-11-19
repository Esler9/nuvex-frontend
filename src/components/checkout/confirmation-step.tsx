"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CircleAlert, CircleCheckBig, Clock } from "lucide-react";
import type { Order } from "@/types/account";
import { ProductThumb } from "@/components/account/status-ui";
import { OrderSummary } from "@/components/checkout/order-summary";
import { useStore } from "@/components/store/store-provider";
import { TextField } from "@/components/ui/field";
import { ui } from "@/components/ui/styles";
import { accountStore } from "@/lib/account-store";
import { formatAddress, invoiceLabel } from "@/lib/checkout";
import { gtq } from "@/lib/format";
import { isPaid, statusMeta } from "@/lib/order-status";

const methodLabel: Record<Order["payment"]["method"], string> = {
  deposito: "Depósito bancario",
  transferencia: "Transferencia bancaria",
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
};

/** Estado del pedido recién creado: verificando, confirmado o rechazado. Nunca muestra el DPI. */
export function ConfirmationStep({ order, demo, guest }: { order: Order; demo: boolean; guest: boolean }) {
  const rejected = order.status === "rechazado";
  const paid = isPaid(order.status);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className={`${ui.card} text-center`} aria-live="polite">
        <span className={`mx-auto grid size-16 place-items-center rounded-full ${rejected ? "bg-danger/10 text-danger" : paid ? "bg-success/10 text-success" : "bg-accent-soft text-accent-text"}`}>
          {rejected ? <CircleAlert aria-hidden className="size-8" /> : paid ? <CircleCheckBig aria-hidden className="size-8" /> : <Clock aria-hidden className="size-8" />}
        </span>
        <p className="mt-3 text-sm font-semibold text-muted">Compra #{order.id}</p>
        <h2 className="mt-1 text-xl font-bold">{rejected ? "No pudimos verificar tu pago" : paid ? "¡Tu depósito fue confirmado!" : "Esperando confirmación de depósito"}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          {rejected ? order.rejectionReason || statusMeta.rechazado.note : paid ? "Estamos preparando tu pedido." : statusMeta.esperando.note}
        </p>
        {rejected && (
          <Link href={`/mi-cuenta/compras/${order.id}#comprobante`} className={`${ui.btnPrimary} mt-4`}>
            Subir otro comprobante
          </Link>
        )}
        {demo && (
          <p className="mx-auto mt-4 max-w-md rounded-lg bg-surface p-2 text-xs text-muted">
            Modo demostración: este pedido no es real. Quedó guardado para el panel, pero no se envió ningún correo ni se apartó inventario.
          </p>
        )}
      </section>

      {guest && <CreateAccountCard order={order} />}

      <section aria-labelledby="resumen-pedido" className={ui.card}>
        <h2 id="resumen-pedido" className={ui.eyebrow}>
          Resumen del pedido
        </h2>
        <ul className="mt-3 divide-y divide-border">
          {order.lines.map((l) => (
            <li key={l.productId} className="flex items-center gap-3 py-3">
              <ProductThumb src={l.image} size="size-14" badge={l.quantity} />
              <div className="min-w-0 flex-1 text-sm">
                <p className="line-clamp-2 font-semibold">{l.name}</p>
                <p className="text-muted">
                  {l.quantity} × {gtq(l.unitPrice)}
                </p>
              </div>
              <p className="text-sm font-bold">{gtq(l.unitPrice * l.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 border-t border-border pt-3">
          <OrderSummary
            subtotal={order.subtotal}
            shipping={order.shipping}
            freeShipping={order.shipping === 0}
            promoDiscount={order.promoDiscount}
            promoLabel={order.promoLabel}
            discount={order.discount}
            coupon={order.coupon}
            total={order.total}
          />
        </div>
        <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Dirección de entrega</dt>
            <dd className="font-medium">{formatAddress(order.shippingData)}</dd>
          </div>
          <div>
            <dt className="text-muted">Forma de pago</dt>
            <dd className="font-medium">
              {methodLabel[order.payment.method]}
              {order.payment.bank ? ` · ${order.payment.bank}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Factura</dt>
            <dd className="font-medium">{invoiceLabel(order.billing)}</dd>
          </div>
          <div>
            <dt className="text-muted">Correo</dt>
            <dd className="break-all font-medium">{order.email}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {guest && order.viewUrl ? (
          <Link href={order.viewUrl} className={ui.btnOutline}>
            Ver mi pedido
          </Link>
        ) : (
          <Link href="/mi-cuenta/compras" className={ui.btnOutline}>
            Ver mis compras
          </Link>
        )}
        <Link href="/productos" className={ui.btnPrimary}>
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}

/** Compra sin cuenta: tarjeta lavanda para crear la cuenta con el mismo correo. */
function CreateAccountCard({ order }: { order: Order }) {
  const { notify } = useStore();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    const firstName = order.customer?.firstName ?? order.shippingData.fullName.split(" ")[0] ?? "";
    // Demostración: la contraseña no se guarda. Al crear la cuenta se unen todas las compras con este correo.
    accountStore.register({ name: firstName.split(" ")[0] || "cliente", email: order.email, firstName, lastName: order.customer?.lastName ?? "", phone: order.shippingData.phone });
    setPassword("");
    notify("Tu cuenta fue creada. Tus compras aparecen en Mis compras.");
  }

  return (
    <section aria-labelledby="crear-cuenta-titulo" className="rounded-xl bg-primary-soft p-4 sm:p-5">
      <h2 id="crear-cuenta-titulo" className="font-bold text-foreground">
        Crea tu cuenta para dar seguimiento a tu pedido.
      </h2>
      <form onSubmit={submit} noValidate className="mt-3 space-y-3">
        <TextField id="cf-email" label="Correo electrónico" type="email" value={order.email} readOnly autoComplete="email" />
        <TextField
          id="cf-password"
          name="password"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          hint="Mínimo 8 caracteres."
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          error={error}
          maxLength={128}
        />
        <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-6 font-bold text-white transition-colors hover:bg-primary-strong">
          Crear cuenta
        </button>
      </form>
    </section>
  );
}

export { methodLabel };

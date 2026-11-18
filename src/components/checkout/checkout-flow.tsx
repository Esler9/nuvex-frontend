"use client";

import { useEffect, useRef, useState } from "react";
import { Banknote, Check, Package, ShoppingCart } from "lucide-react";
import type { Coupon, Order } from "@/types/account";
import { useStore } from "@/components/store/store-provider";
import { Stepper, type Step } from "@/components/ui/stepper";
import { CartStep } from "@/components/checkout/cart-step";
import { ShippingStep, emptyForm, type ShippingState } from "@/components/checkout/shipping-step";
import { PaymentForm } from "@/components/checkout/payment-form";
import { ConfirmationStep } from "@/components/checkout/confirmation-step";
import { accountStore, checkCoupon, findGuestOrder, useAccount } from "@/lib/account-store";
import { billingFromForm, orderTotals, shippingFromForm } from "@/lib/checkout";
import { isPaid } from "@/lib/order-status";

const names = ["Carrito", "Envío", "Forma de pago", "Confirmación"];
const icons = [ShoppingCart, Package, Banknote, Check];

/** Orden de compra en 4 pasos. Se puede volver a pasos anteriores, no saltar a los siguientes. */
export function CheckoutFlow() {
  const { lines, subtotal, clearCart, demo, notify } = useStore();
  const account = useAccount();
  const [step, setStep] = useState(0);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [shipping, setShipping] = useState<ShippingState>({ form: emptyForm, save: true, saveLabel: "", addressId: null });
  const [orderId, setOrderId] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const prefilled = useRef(false);

  // Con sesión: se llena con la dirección principal y el correo de la cuenta.
  useEffect(() => {
    if (!account || prefilled.current) return;
    prefilled.current = true;
    const main = account.addresses.find((a) => a.primary) ?? account.addresses[0];
    const billing = account.billing[0];
    setShipping((s) => ({
      ...s,
      addressId: main?.id ?? null,
      saveLabel: main?.label ?? "",
      form: main
        ? { ...s.form, ...main, references: main.references ?? "", dpi: billing?.dpi ?? "", needsNit: !!billing?.nit, nit: billing?.nit ?? "", nitName: billing?.nitName ?? "" }
        : { ...s.form, email: account.customer.email },
    }));
  }, [account]);

  // Un cupón aplicado deja de valer si se cierra la sesión o ya se usó.
  const validCoupon = coupon && checkCoupon(coupon.code, account).ok ? coupon : null;

  const order: Order | null = orderId ? (account?.orders.find((o) => o.id === orderId) ?? findGuestOrder(orderId)) : null;

  function go(next: number) {
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    // Mueve el foco al inicio del paso para teclado y lectores de pantalla.
    window.setTimeout(() => topRef.current?.focus({ preventScroll: true }), 0);
  }

  const total = orderTotals(subtotal, validCoupon?.value ?? 0).total;
  // Sin productos (y sin pedido creado) siempre se regresa al carrito.
  const current = order ? 3 : lines.length ? step : 0;

  const steps: Step[] = names.map((label, i) => {
    const Icon = icons[i];
    const state: Step["state"] = i < current ? "done" : i === current ? "current" : "pending";
    return {
      label,
      icon: <Icon aria-hidden className="size-5" />,
      state,
      tone: i === 3 && order ? (isPaid(order.status) ? "success" : order.status === "rechazado" ? "danger" : "accent") : undefined,
      onSelect: i < current && !order ? () => go(i) : undefined,
    };
  });

  return (
    <div className="container-shell py-6 sm:py-8">
      <div className="mx-auto max-w-2xl">
        <Stepper steps={steps} label="Pasos de la orden de compra" />
      </div>
      <div ref={topRef} tabIndex={-1} className="scroll-mt-40 pt-6 outline-none sm:pt-8">
        <h2 className="sr-only">
          Paso {current + 1} de 4: {names[current]}
        </h2>
        {current === 0 && <CartStep coupon={validCoupon} onCoupon={setCoupon} onContinue={() => go(1)} />}
        {current === 1 && <ShippingStep value={shipping} onChange={setShipping} onContinue={() => go(2)} />}
        {current === 2 && (
          <PaymentForm
            total={total}
            blockedReason={!demo ? "Los pedidos en línea se habilitarán pronto. Mientras tanto, escríbenos por WhatsApp para completar tu compra." : undefined}
            onSubmit={(payment) => {
              const f = shipping.form;
              const created = accountStore.placeOrder(
                {
                  lines: lines.map((l) => ({ productId: l.id, slug: l.slug, name: l.name, detail: l.detail, image: l.image, unitPrice: l.unitPrice, quantity: l.quantity })),
                  coupon: validCoupon ?? undefined,
                  email: f.email.trim(),
                  shippingData: shippingFromForm(f),
                  billing: billingFromForm(f),
                  payment,
                  save: account && shipping.save ? { label: shipping.saveLabel } : undefined,
                },
                account ?? null,
              );
              clearCart();
              setCoupon(null);
              setOrderId(created.id);
              notify(`Compra #${created.id} creada`);
              go(3);
            }}
          />
        )}
        {current === 3 && order && <ConfirmationStep order={order} demo={demo} />}
      </div>
    </div>
  );
}

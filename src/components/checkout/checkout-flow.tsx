"use client";

import { useEffect, useRef, useState } from "react";
import { Banknote, Check, Package, ShoppingCart } from "lucide-react";
import type { Coupon, Order, PaymentData } from "@/types/account";
import { useStore } from "@/components/store/store-provider";
import { Stepper, type Step } from "@/components/ui/stepper";
import { CartStep } from "@/components/checkout/cart-step";
import { ShippingStep, effectiveForm, emptyForm, type ShippingState } from "@/components/checkout/shipping-step";
import { PaymentForm } from "@/components/checkout/payment-form";
import { ConfirmationStep } from "@/components/checkout/confirmation-step";
import { placeOrderAction } from "@/app/(store)/actions";
import { accountStore, checkCoupon, findGuestOrder, useAccount } from "@/lib/account-store";
import { billingFromForm, fullName, orderTotals, shippingFromForm } from "@/lib/checkout";
import { isPaid } from "@/lib/order-status";
import { cartPromotion } from "@/lib/promotions";

const names = ["Carrito", "Envío", "Forma de pago", "Confirmación"];
const icons = [ShoppingCart, Package, Banknote, Check];

/** "Juan Carlos Pérez López" → nombres y apellidos (para direcciones guardadas antes del cambio). */
function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { firstName: parts[0] ?? "", lastName: "" };
  const cut = parts.length >= 4 ? 2 : 1;
  return { firstName: parts.slice(0, cut).join(" "), lastName: parts.slice(cut).join(" ") };
}

/** Orden de compra en 4 pasos. Se puede volver a pasos anteriores, no saltar a los siguientes. */
export function CheckoutFlow() {
  const { lines, subtotal, clearCart, demo, notify, promotions, cfLimit } = useStore();
  const account = useAccount();
  const [step, setStep] = useState(0);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [shipping, setShipping] = useState<ShippingState>({ form: emptyForm, save: true, saveLabel: "", addressId: null });
  const [orderId, setOrderId] = useState<string | null>(null);
  /** El pedido se hizo sin cuenta (para ofrecer crearla en la confirmación). */
  const [asGuest, setAsGuest] = useState(false);
  const placing = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);
  const prefilled = useRef(false);

  // Con sesión: se llena con los datos guardados de la cuenta (perfil, dirección principal y facturación).
  useEffect(() => {
    if (!account || prefilled.current) return;
    prefilled.current = true;
    const c = account.customer;
    const main = account.addresses.find((a) => a.primary) ?? account.addresses[0];
    const billing = account.billing[0];
    const who = c.firstName ? { firstName: c.firstName, lastName: c.lastName ?? "" } : splitName(main?.fullName ?? "");
    setShipping((s) => {
      const base = { ...s.form, ...who, email: c.email, phone: c.phone ?? main?.phone ?? "", dpi: c.dpi ?? billing?.dpi ?? "" };
      const invoiceName = billing?.name || fullName(base);
      return {
        ...s,
        addressId: main?.id ?? null,
        saveLabel: main?.label ?? "",
        form: {
          ...base,
          ...(main ? { email: main.email || c.email, department: main.department, municipality: main.municipality, zone: main.zone, street: main.street, references: main.references ?? "" } : {}),
          needsNit: !!billing?.nit,
          nit: billing?.nit ?? "",
          invoiceName,
          invoiceNameEdited: invoiceName !== fullName(base),
        },
      };
    });
  }, [account]);

  // Un cupón aplicado deja de valer si se cierra la sesión o ya se usó.
  const validCoupon = coupon && checkCoupon(coupon.code, account).ok ? coupon : null;
  const promo = cartPromotion(lines, promotions, Boolean(account));

  const order: Order | null = orderId ? (account?.orders.find((o) => o.id === orderId) ?? findGuestOrder(orderId)) : null;

  function go(next: number) {
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    // Mueve el foco al inicio del paso para teclado y lectores de pantalla.
    window.setTimeout(() => topRef.current?.focus({ preventScroll: true }), 0);
  }

  const total = orderTotals(subtotal, validCoupon?.value ?? 0, promo.discount).total;
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

  async function submitOrder(payment: PaymentData) {
    if (placing.current) return;
    placing.current = true;
    const f = effectiveForm(shipping.form, total, cfLimit);
    const email = f.email.trim().toLowerCase();
    const profile = { firstName: f.firstName.trim(), lastName: f.lastName.trim(), phone: f.phone.replace(/\D/g, ""), dpi: f.dpi.replace(/\D/g, "") };
    // Crear cuenta desde la compra: solo contraseña; los demás datos salen del formulario.
    // (Demostración: la contraseña no se guarda; con WooCommerce se creará el cliente real.)
    const creating = !account && f.createAccount;
    if (creating) accountStore.register({ name: profile.firstName.split(" ")[0] || profile.firstName, email, ...profile });
    const accountEmail = account?.customer.email ?? (creating ? email : undefined);
    try {
      const result = await placeOrderAction(
        {
          lines: lines.map((l) => ({ productId: l.id, parentId: l.productId, categories: l.categories, slug: l.slug, name: l.name, detail: l.detail, image: l.image, unitPrice: l.unitPrice, quantity: l.quantity })),
          email,
          customer: { firstName: profile.firstName, lastName: profile.lastName },
          shippingData: shippingFromForm(f),
          billing: billingFromForm(f),
          payment,
        },
        { accountEmail, coupon: validCoupon ? { code: validCoupon.code, value: validCoupon.value } : undefined },
      );
      if (!result.ok) {
        notify(result.error);
        return;
      }
      const save = creating || (account && shipping.save) ? { label: shipping.saveLabel || "Mi dirección", profile } : undefined;
      accountStore.recordOrder(result.order, save);
      clearCart();
      setCoupon(null);
      setAsGuest(!accountEmail);
      setOrderId(result.order.id);
      notify(`Compra #${result.order.id} creada`);
      go(3);
    } catch {
      notify("No pudimos guardar tu pedido. Revisa tu conexión e intenta de nuevo.");
    } finally {
      placing.current = false;
    }
  }

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
        {current === 1 && <ShippingStep value={shipping} total={total} onChange={setShipping} onContinue={() => go(2)} />}
        {current === 2 && (
          <PaymentForm
            total={total}
            blockedReason={!demo ? "Los pedidos en línea se habilitarán pronto. Mientras tanto, escríbenos por WhatsApp para completar tu compra." : undefined}
            onSubmit={(payment) => void submitOrder(payment)}
          />
        )}
        {current === 3 && order && <ConfirmationStep order={order} demo={demo} guest={asGuest && !account} />}
      </div>
    </div>
  );
}

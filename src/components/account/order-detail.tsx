"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, FileText, Package, PackageCheck, Star } from "lucide-react";
import type { AccountData, Order, OrderStatus } from "@/types/account";
import { useStore } from "@/components/store/store-provider";
import { EmptyBlock } from "@/components/account/account-shell";
import { ProductThumb, StatusIcon } from "@/components/account/status-ui";
import { ReviewDialog, type ReviewTarget } from "@/components/account/review-dialog";
import { OrderSummary } from "@/components/checkout/order-summary";
import { PaymentForm } from "@/components/checkout/payment-form";
import { methodLabel } from "@/components/checkout/confirmation-step";
import { WhatsAppIcon } from "@/components/icons/brand-icons";
import { CopyButton, copyText } from "@/components/ui/copy-button";
import { Sheet } from "@/components/ui/sheet";
import { Stepper, type Step } from "@/components/ui/stepper";
import { ui } from "@/components/ui/styles";
import { accountStore, reviewFor } from "@/lib/account-store";
import { formatAddress, invoiceLabel, trackingHref } from "@/lib/checkout";
import { formatDate, formatDateTime, gtq } from "@/lib/format";
import { isPaid, isShipped, statusMeta, statusRank } from "@/lib/order-status";
import { siteConfig, whatsappLink } from "@/lib/site-config";

function statusSteps(o: Order): Step[] {
  const rank = statusRank(o.status);
  const at = (s: OrderStatus) => (o.history[s] ? formatDateTime(o.history[s]!) : undefined);
  /** Un paso empieza en `start` y se completa al llegar a `end` (o al pasarlo, si es el mismo estado). */
  const state = (start: OrderStatus, end: OrderStatus): Step["state"] => {
    if (rank < statusRank(start)) return "pending";
    const completed = start === end ? rank > statusRank(end) : rank >= statusRank(end);
    return completed ? "done" : "current";
  };
  const rejected = o.status === "rechazado";
  const paid = isPaid(o.status);
  const listo = rank >= statusRank("listo");
  const delivered = o.status === "entregado";
  return [
    rejected
      ? { label: "Pago rechazado", icon: <StatusIcon name="alert" className="size-5" />, state: "current", tone: "danger" }
      : paid
        ? { label: "Pago confirmado", icon: <StatusIcon name="check" className="size-5" />, state: "done", sub: at("confirmado") }
        : { label: "Esperando confirmación", icon: <StatusIcon name="clock" className="size-5" />, state: "current", tone: "accent", sub: at("esperando") },
    {
      label: listo ? "Pedido listo" : "Preparando pedido",
      icon: <StatusIcon name={listo ? "box-check" : "box"} className="size-5" />,
      state: state("preparando", "listo"),
      sub: listo ? at("listo") : at("preparando"),
    },
    { label: "Esperando transporte", icon: <StatusIcon name="truck" className="size-5" />, state: state("transporte", "transporte"), sub: at("transporte") },
    {
      label: delivered ? "Entregado" : "Pedido enviado",
      icon: <StatusIcon name={delivered ? "check-circle" : "package-check"} className="size-5" />,
      state: isShipped(o.status) ? "done" : "pending",
      tone: isShipped(o.status) ? "success" : undefined,
      sub: delivered ? at("entregado") : at("enviado"),
    },
  ];
}

/** Detalle de una compra. Con cuenta permite opinar y reenviar comprobante; desde "Ver mi pedido" es solo consulta. */
export function OrderDetail({ account = null, orderId, order: given }: { account?: AccountData | null; orderId: string; order?: Order | null }) {
  const { notify } = useStore();
  const [review, setReview] = useState<ReviewTarget | null>(null);
  const [zoom, setZoom] = useState(false);
  const [receipt, setReceipt] = useState(false);
  const order = given ?? account?.orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <EmptyBlock
        icon={<Package aria-hidden className="size-12 text-primary" strokeWidth={1.5} />}
        title="No encontramos esta compra"
        text="Revisa el número o vuelve a la lista de tus compras."
        action={
          <Link href="/mi-cuenta/compras" className={ui.btnOutline}>
            Ver mis compras
          </Link>
        }
      />
    );
  }

  const o = order;
  const delivered = o.status === "entregado";
  const paid = isPaid(o.status);
  const shipped = isShipped(o.status) && o.tracking;
  const support = whatsappLink(`Hola, necesito ayuda con mi compra #${o.id}.`);
  const reviewPoints = siteConfig.points.enabled ? siteConfig.points.perReview : 0;

  async function track(number: string) {
    const copied = await copyText(number);
    notify(copied ? "Número de guía copiado. Pégalo en la página de Cargo Expreso para rastrear tu paquete." : `Tu número de guía es ${number}.`);
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xl font-bold sm:text-2xl">Compra #{o.id}</p>
        <p className="text-sm text-muted">{formatDateTime(o.createdAt)}</p>
        {o.demo && <p className="mt-2 inline-block rounded-lg bg-surface px-2 py-1 text-xs text-muted">Pedido de demostración</p>}
      </header>

      <section aria-label="Estado del pedido" className={ui.card}>
        <Stepper steps={statusSteps(o)} label="Estado del pedido" />
        {o.status === "rechazado" && (
          <div className="mt-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">
            <p className="font-semibold">No pudimos verificar tu pago</p>
            {o.rejectionReason && <p className="mt-1">{o.rejectionReason}</p>}
            <a href={account ? "#comprobante" : (support ?? "#")} className={`${ui.btnPrimary} mt-3 w-full sm:w-auto`}>
              {account ? "Subir otro comprobante" : "Enviar otro comprobante por WhatsApp"}
            </a>
          </div>
        )}
      </section>

      {shipped ? (
        <section aria-labelledby="envio-titulo" className={ui.card}>
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success/10 text-success">
              <PackageCheck aria-hidden className="size-5" />
            </span>
            <div>
              <h2 id="envio-titulo" className="font-bold">
                Pedido enviado
              </h2>
              <p className="text-sm text-muted">{formatDateTime(o.tracking!.shippedAt)}</p>
              <p className="text-sm">Enviado por {o.tracking!.carrier}</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Número de guía</p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-2xl font-black tracking-wider">{o.tracking!.number}</p>
              <CopyButton text={o.tracking!.number} notice="Número de guía copiado" />
            </div>
          </div>
          <a href={trackingHref(o.tracking!.number)} target="_blank" rel="noopener noreferrer" onClick={() => void track(o.tracking!.number)} className={`${ui.btnBlue} mt-4 w-full`}>
            Rastrear mi paquete
          </a>
          <p className="mt-2 text-center text-xs text-muted">Pega tu número de guía en la sección de rastreo de Cargo Expreso.</p>
          <div className="mt-4">
            <p className="text-sm font-medium">Foto del paquete</p>
            {o.tracking!.photo ? (
              <button type="button" onClick={() => setZoom(true)} className="mt-2 block overflow-hidden rounded-xl border border-border" aria-label="Ver foto del paquete en grande">
                <img src={o.tracking!.photo} alt="Foto del paquete enviado" className="size-24 object-cover" />
              </button>
            ) : (
              <div className="mt-2 grid size-24 place-items-center rounded-xl border border-dashed border-border bg-surface text-center text-[11px] text-muted">
                <span>
                  <Package aria-hidden className="mx-auto mb-1 size-5" />
                  Sin foto
                </span>
              </div>
            )}
          </div>
        </section>
      ) : (
        o.status !== "rechazado" && <p className={`${ui.card} text-sm`}>{statusMeta[o.status].note}</p>
      )}

      <section aria-labelledby="productos-titulo" className={ui.card}>
        <h2 id="productos-titulo" className={ui.eyebrow}>
          Productos
        </h2>
        <ul className="mt-3 divide-y divide-border">
          {o.lines.map((l) => {
            const mine = account ? reviewFor(account, o.id, l.productId) : undefined;
            return (
              <li key={l.productId} className="py-3">
                <div className="flex gap-3">
                  <ProductThumb src={l.image} size="size-16" badge={l.quantity} />
                  <div className="min-w-0 flex-1 text-sm">
                    <Link href={`/productos/${encodeURIComponent(l.slug)}`} className="line-clamp-2 font-semibold hover:text-primary-strong">
                      {l.name}
                    </Link>
                    {l.detail && <p className="text-muted">{l.detail}</p>}
                    <p className="text-muted">{gtq(l.unitPrice)} c/u</p>
                  </div>
                  <p className="text-sm font-bold">{gtq(l.unitPrice * l.quantity)}</p>
                </div>
                {delivered && account && (
                  <button type="button" onClick={() => setReview({ orderId: o.id, line: l, existing: mine })} className={`${mine ? ui.btnGhost : ui.btnOutline} mt-3 min-h-11 w-full text-sm`}>
                    <Star aria-hidden className="size-4" />
                    {mine ? "Ver mi opinión" : reviewPoints ? `Calificar y ganar ${reviewPoints} pts` : "Calificar"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="pago-titulo" className={ui.card}>
        <h2 id="pago-titulo" className={ui.eyebrow}>
          Resumen del pago
        </h2>
        <div className="mt-3">
          <OrderSummary
            subtotal={o.subtotal}
            shipping={o.shipping}
            freeShipping={o.shipping === 0}
            discount={o.discount}
            coupon={o.coupon}
            promoDiscount={o.promoDiscount}
            promoLabel={o.promoLabel}
            total={o.total}
            totalBadge={<span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${paid ? "bg-success/10 text-success" : "bg-accent-soft text-accent-text"}`}>{paid ? "Pagado" : "Pendiente de confirmación"}</span>}
          />
        </div>
      </section>

      <section aria-labelledby="datos-titulo" className={`${ui.card} space-y-5 text-sm`}>
        <h2 id="datos-titulo" className={ui.eyebrow}>
          Datos del pedido
        </h2>
        <div>
          <h3 className="font-semibold">Datos de envío</h3>
          <p className="mt-1">{o.shippingData.fullName}</p>
          <p className="text-muted">Tel. {o.shippingData.phone}</p>
          <p className="text-muted">{formatAddress(o.shippingData)}</p>
          {o.shippingData.references && <p className="text-muted">Referencias: {o.shippingData.references}</p>}
        </div>
        <div className="border-t border-border pt-4">
          <h3 className="font-semibold">Forma de pago</h3>
          <p className="mt-1">
            {methodLabel[o.payment.method]}
            {o.payment.bank ? ` · ${o.payment.bank}` : ""}
          </p>
          <p className="text-muted">
            Boleta o referencia {o.payment.reference} · {formatDate(`${o.payment.date}T12:00:00-06:00`)}
          </p>
          <button type="button" onClick={() => setReceipt(true)} className={`${ui.btnGhost} mt-2`}>
            <FileText aria-hidden className="size-4" /> Ver comprobante
          </button>
        </div>
        <div className="border-t border-border pt-4">
          <h3 className="font-semibold">Facturación</h3>
          <p className="mt-1">{invoiceLabel(o.billing)}</p>
          <p className="break-all text-muted">Factura enviada a {o.email}</p>
          {o.invoiceUrl ? (
            <a href={o.invoiceUrl} target="_blank" rel="noopener noreferrer" className={`${ui.btnGhost} mt-2`}>
              <Download aria-hidden className="size-4" /> Descargar factura
            </a>
          ) : (
            <>
              <button type="button" disabled aria-describedby="factura-pendiente" className={`${ui.btnGhost} mt-2 cursor-not-allowed opacity-60`}>
                <Download aria-hidden className="size-4" /> Descargar factura
              </button>
              <p id="factura-pendiente" className="mt-1 text-xs text-muted">
                La factura estará disponible cuando la tienda la emita.
              </p>
            </>
          )}
        </div>
      </section>

      {o.status === "rechazado" && account && (
        <section id="comprobante" aria-labelledby="reenviar-titulo" className="scroll-mt-40">
          <h2 id="reenviar-titulo" className="mb-3 text-lg font-bold">
            Subir otro comprobante
          </h2>
          <PaymentForm
            total={o.total}
            submitLabel="Subir otro comprobante"
            onSubmit={(payment) => {
              accountStore.resubmitPayment(o.id, payment);
              notify("Recibimos tu nuevo comprobante. Lo estamos verificando.");
            }}
          />
        </section>
      )}

      {support ? (
        <a href={support} target="_blank" rel="noopener noreferrer" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-whatsapp-bright px-6 font-bold text-white transition-opacity hover:opacity-90">
          <WhatsAppIcon className="size-5" /> Soporte sobre este pedido por WhatsApp
        </a>
      ) : (
        <span className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-whatsapp-bright px-6 font-bold text-white" title="Configura NEXT_PUBLIC_WHATSAPP_NUMBER">
          <WhatsAppIcon className="size-5" /> WhatsApp próximamente
        </span>
      )}

      <ReviewDialog target={review} onClose={() => setReview(null)} />
      <Sheet open={zoom} onClose={() => setZoom(false)} title="Foto del paquete" side="center">
        {o.tracking?.photo && <img src={o.tracking.photo} alt="Foto del paquete enviado" className="w-full rounded-lg" />}
      </Sheet>
      <Sheet open={receipt} onClose={() => setReceipt(false)} title="Comprobante de pago" side="center">
        <div className="text-sm">
          <p>
            {methodLabel[o.payment.method]}
            {o.payment.bank ? ` · ${o.payment.bank}` : ""} · Ref. {o.payment.reference}
          </p>
          {o.payment.receiptName && <p className="mt-1 text-muted">Archivo: {o.payment.receiptName}</p>}
          <p className="mt-3 rounded-lg bg-surface p-3 text-muted">
            {o.demo ? "En la demostración el comprobante no se guarda. Con la tienda conectada, aquí verás la foto o el PDF que subiste." : "El comprobante se está cargando desde la tienda."}
          </p>
        </div>
      </Sheet>
    </div>
  );
}

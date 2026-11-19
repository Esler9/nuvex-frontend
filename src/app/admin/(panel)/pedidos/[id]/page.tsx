import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { OrderStatus } from "@/types/account";
import { confirmPaymentAction, updateStatusAction, uploadInvoiceAction } from "@/app/admin/order-actions";
import { Alert, inputClass } from "@/components/admin/fields";
import { CopyButton, CopyRow } from "@/components/admin/copy-field";
import { PageHeader, StatusPill } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/session";
import { formatAddress, formatDpi } from "@/lib/checkout";
import { formatDate, formatDateTime, gtq } from "@/lib/format";
import { originLabel, paymentLabel } from "@/lib/order-labels";
import { isPaid, statusMeta } from "@/lib/order-status";
import { getAdminOrder } from "@/lib/server/admin-store";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Pedido #${decodeURIComponent((await params).id).slice(0, 20)}` };
}

const STATUS_ORDER: OrderStatus[] = ["esperando", "rechazado", "confirmado", "preparando", "listo", "transporte", "enviado", "entregado"];
const card = "rounded-xl border border-border bg-card p-4 sm:p-6";
const h2 = "text-base font-semibold";
const fileLink = (rel: string) => `/api/admin/archivo?f=${encodeURIComponent(rel)}`;
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

export default async function AdminOrderPage({ params, searchParams }: Props) {
  await requireAdmin();
  const id = decodeURIComponent((await params).id).slice(0, 20);
  const sp = await searchParams;
  const o = await getAdminOrder(id);
  if (!o) notFound();

  const name = [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(" ") || o.shippingData.fullName;
  const viewUrl = `${siteUrl}/pedido/${encodeURIComponent(o.id)}?t=${o.token}`;
  const products = o.lines.map((l) => `${l.quantity} × ${l.name}${l.detail ? ` (${l.detail})` : ""} — ${gtq(l.unitPrice)} c/u = ${gtq(l.unitPrice * l.quantity)}`);
  const address = [formatAddress(o.shippingData), o.shippingData.references ? `Ref.: ${o.shippingData.references}` : ""].filter(Boolean).join(". ");

  return (
    <>
      <PageHeader title={`Pedido #${o.id}`} description={`${formatDateTime(o.createdAt)} · ${originLabel[o.origin]} · ${o.accountEmail ? "Con cuenta" : "Sin cuenta"}`} back={{ href: "/admin/pedidos", label: "Pedidos" }} />
      <div className="grid gap-4">
        {sp.creado && <Alert tone="success">Pedido manual creado.</Alert>}
        {sp.guardado && <Alert tone="success">Pedido actualizado. Se registró el correo del nuevo estado con el enlace “Ver mi pedido”.</Alert>}
        {sp.factura && <Alert tone="success">Factura subida. El pedido salió de Facturas pendientes y se registró el envío al correo del cliente.</Alert>}
        {sp.aviso && <Alert tone="info">{sp.aviso.slice(0, 400)}</Alert>}
        {sp.error && <Alert>{sp.error.slice(0, 300)}</Alert>}

        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <div className="grid gap-4">
            <section aria-labelledby="estado-t" className={card}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="estado-t" className={h2}>Estado</h2>
                <StatusPill tone={o.status === "rechazado" ? "danger" : isPaid(o.status) ? "success" : "neutral"}>{statusMeta[o.status].label}</StatusPill>
              </div>
              {o.status === "esperando" && (
                <form action={confirmPaymentAction} className="mt-3">
                  <input type="hidden" name="id" value={o.id} />
                  <button type="submit" className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-success px-5 text-sm font-semibold text-white hover:opacity-90">
                    Marcar pago como confirmado
                  </button>
                </form>
              )}
              <form action={updateStatusAction} className="mt-4 grid gap-3">
                <input type="hidden" name="id" value={o.id} />
                <div className="grid gap-1.5">
                  <label htmlFor="status" className="text-sm font-medium">Cambiar estado</label>
                  <select id="status" name="status" defaultValue={o.status} className={inputClass}>
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>{statusMeta[s].label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="tracking" className="text-sm font-medium">Número de guía de Cargo Expreso</label>
                  <input id="tracking" name="tracking" defaultValue={o.tracking?.number} maxLength={40} className={inputClass} />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="photo" className="text-sm font-medium">Foto del paquete</label>
                  <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-strong" />
                  {o.tracking?.photo && <a href={fileLink(o.tracking.photo)} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary-strong hover:underline">Ver foto actual</a>}
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="reason" className="text-sm font-medium">Motivo (solo si el pago se rechaza)</label>
                  <input id="reason" name="reason" defaultValue={o.rejectionReason} maxLength={300} className={inputClass} />
                </div>
                <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary-strong px-5 text-sm font-semibold text-white hover:bg-navy">Guardar estado</button>
              </form>
            </section>

            <section aria-labelledby="factura-t" className={card}>
              <h2 id="factura-t" className={h2}>Factura</h2>
              {o.invoice ? (
                <p className="mt-2 text-sm">
                  Subida el {formatDate(o.invoice.uploadedAt)} ·{" "}
                  <a href={fileLink(o.invoice.file)} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-strong hover:underline">Ver PDF</a>
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted">{isPaid(o.status) ? "Pendiente: el pago está confirmado." : "Se emite cuando el pago esté confirmado."}</p>
              )}
              <form action={uploadInvoiceAction} className="mt-3 grid gap-3">
                <input type="hidden" name="id" value={o.id} />
                <label htmlFor="invoice" className="text-sm font-medium">{o.invoice ? "Reemplazar factura (PDF)" : "Subir factura (PDF)"}</label>
                <input id="invoice" name="invoice" type="file" accept="application/pdf" required className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-strong" />
                <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary px-5 text-sm font-semibold text-primary-strong hover:bg-primary-soft">Subir y enviar al cliente</button>
              </form>
            </section>

            <section aria-labelledby="pago-t" className={card}>
              <h2 id="pago-t" className={h2}>Pago</h2>
              <p className="mt-2 text-sm">
                {paymentLabel[o.payment.method]}
                {o.payment.bank && ` · ${o.payment.bank}`}
                {o.payment.reference && ` · Ref. ${o.payment.reference}`}
                {o.payment.date && ` · ${o.payment.date}`}
              </p>
              {o.paymentProof ? (
                <a href={fileLink(o.paymentProof.file)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-medium text-primary-strong hover:underline">Ver comprobante</a>
              ) : (
                <p className="mt-1 text-xs text-muted">{o.payment.receiptName ? `Archivo del cliente: ${o.payment.receiptName} (en la demostración no se guarda).` : "Sin comprobante adjunto."}</p>
              )}
            </section>
          </div>

          <div className="grid gap-4">
            <section aria-labelledby="facturar-t" className={card}>
              <h2 id="facturar-t" className={h2}>Datos para facturar</h2>
              <dl className="mt-1 divide-y divide-border">
                <CopyRow label="Tipo" value={o.billing.nit ? "NIT" : "Consumidor Final (CF)"} />
                {o.billing.nit && <CopyRow label="NIT" value={o.billing.nit} mono />}
                <CopyRow label="Nombre para la factura" value={o.billing.name} />
                <CopyRow label="DPI" value={formatDpi(o.billing.dpi)} mono />
                <CopyRow label="Correo" value={o.email} />
                {products.map((p, i) => (
                  <CopyRow key={i} label={i === 0 ? "Productos" : " "} value={p} />
                ))}
                {o.promoDiscount ? <CopyRow label={o.promoLabel || "Promoción"} value={`−${gtq(o.promoDiscount)}`} /> : null}
                {o.discount ? <CopyRow label={`Cupón ${o.coupon ?? ""}`} value={`−${gtq(o.discount)}`} /> : null}
                <CopyRow label="Envío" value={o.shipping ? gtq(o.shipping) : "Gratis (Q0.00)"} />
                <CopyRow label="Total" value={gtq(o.total)} />
              </dl>
            </section>

            <section aria-labelledby="envio-t" className={card}>
              <h2 id="envio-t" className={h2}>Datos de envío</h2>
              <dl className="mt-1 divide-y divide-border">
                <CopyRow label="Recibe" value={o.shippingData.fullName || name} />
                <CopyRow label="Teléfono" value={o.shippingData.phone} mono />
                <CopyRow label="Dirección completa" value={address} />
              </dl>
            </section>

            <section aria-labelledby="cliente-t" className={card}>
              <h2 id="cliente-t" className={h2}>Cliente</h2>
              <p className="mt-2 text-sm font-medium">{name}</p>
              <p className="text-sm text-muted">{o.email}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-strong hover:underline">Abrir “Ver mi pedido”</a>
                <CopyButton value={viewUrl} label="enlace Ver mi pedido" />
              </div>
              <Link href={`/admin/clientes?q=${encodeURIComponent(o.email)}`} className="mt-2 inline-block text-sm text-muted hover:text-foreground">Historial del cliente →</Link>
            </section>

            <section aria-labelledby="correos-t" className={card}>
              <h2 id="correos-t" className={h2}>Correos al cliente</h2>
              <p className="mt-1 text-xs text-muted">Pendiente de conectar el envío real. Cada correo incluye el enlace “Ver mi pedido” y nunca el DPI.</p>
              {o.emails.length ? (
                <ul className="mt-2 divide-y divide-border text-sm">
                  {o.emails.map((e, i) => (
                    <li key={i} className="flex justify-between gap-3 py-2">
                      <span>{e.subject}</span>
                      <span className="shrink-0 text-xs text-muted">{formatDateTime(e.at)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">Sin correos registrados.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

import type { OrderStatus } from "@/types/account";

export type Tone = "accent" | "danger" | "primary" | "success";
export type StatusIcon = "clock" | "alert" | "check" | "box" | "box-check" | "truck" | "package-check" | "check-circle";

/** Etiqueta, color e ícono de cada estado del pedido. */
export const statusMeta: Record<OrderStatus, { label: string; tone: Tone; icon: StatusIcon; note: string }> = {
  esperando: { label: "Esperando confirmación", tone: "accent", icon: "clock", note: "Recibimos tu comprobante. Estamos verificando tu depósito; te avisaremos por correo cuando esté confirmado." },
  rechazado: { label: "Pago rechazado", tone: "danger", icon: "alert", note: "No pudimos verificar tu pago." },
  confirmado: { label: "Pago confirmado", tone: "primary", icon: "check", note: "Tu pago fue confirmado. Pronto empezaremos a preparar tu pedido." },
  preparando: { label: "Preparando pedido", tone: "primary", icon: "box", note: "Estamos preparando tu pedido. Te avisaremos por correo cuando sea enviado." },
  listo: { label: "Pedido listo", tone: "primary", icon: "box-check", note: "Tu pedido está listo. Pronto lo entregaremos a Cargo Expreso." },
  transporte: { label: "Esperando transporte", tone: "primary", icon: "truck", note: "Tu pedido está esperando el transporte de Cargo Expreso. Te avisaremos por correo cuando sea enviado." },
  enviado: { label: "Pedido enviado", tone: "success", icon: "package-check", note: "" },
  entregado: { label: "Entregado", tone: "success", icon: "check-circle", note: "" },
};

const order: OrderStatus[] = ["esperando", "confirmado", "preparando", "listo", "transporte", "enviado", "entregado"];

/** Posición en el flujo (rechazado cuenta como el inicio). */
export function statusRank(s: OrderStatus) {
  return s === "rechazado" ? 0 : order.indexOf(s);
}

export const isPaid = (s: OrderStatus) => statusRank(s) >= statusRank("confirmado");
export const isShipped = (s: OrderStatus) => s === "enviado" || s === "entregado";
export const isInProgress = (s: OrderStatus) => s !== "entregado";

/** Clases de píldora por tono (colores semánticos del sitio). */
export const toneClasses: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent-text",
  danger: "bg-danger/10 text-danger",
  primary: "bg-primary-soft text-primary-strong",
  success: "bg-success/10 text-success",
};

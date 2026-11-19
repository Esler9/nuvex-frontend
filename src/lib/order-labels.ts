import type { OrderOrigin, PaymentMethod } from "@/types/account";

export const originLabel: Record<OrderOrigin, string> = { web: "Sitio web", whatsapp: "WhatsApp", tienda: "Tienda", telefono: "Teléfono" };

export const paymentLabel: Record<PaymentMethod, string> = {
  deposito: "Depósito bancario",
  transferencia: "Transferencia bancaria",
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
};

/**
 * Contratos de cuenta, pedidos y Puntos NUVEX.
 * Hoy se llenan con datos de ejemplo (modo demostración); cuando exista el backend,
 * WooCommerce será la fuente de verdad y estos tipos se mapearán desde su API.
 * Todos los montos van en centavos (unidades menores de GTQ).
 */

export type Customer = { name: string; email: string };

export type OrderStatus =
  | "esperando" // Esperando confirmación de depósito
  | "rechazado" // Comprobante rechazado
  | "confirmado"
  | "preparando"
  | "listo"
  | "transporte" // Esperando transporte (se genera la guía)
  | "enviado"
  | "entregado";

export type ShippingData = {
  fullName: string;
  phone: string;
  department: string;
  municipality: string;
  /** Zona, barrio o colonia. */
  zone: string;
  /** Calle, número de casa, lugar de residencia. */
  street: string;
  references?: string;
};

export type SavedAddress = ShippingData & { id: string; label: string; email: string; primary: boolean };

/** Datos de facturación. Sin NIT se factura a "Consumidor Final (CF)". */
export type BillingData = { name: string; dpi: string; nit?: string; nitName?: string };
export type SavedBilling = BillingData & { id: string };

export type PaymentMethod = "deposito" | "transferencia";
export type PaymentData = { method: PaymentMethod; bank: string; reference: string; date: string; receiptName?: string };

export type OrderLine = { productId: number; slug: string; name: string; detail?: string; image?: string; unitPrice: number; quantity: number };

export type Order = {
  /** Número visible, p. ej. "02-40321". */
  id: string;
  createdAt: string;
  status: OrderStatus;
  /** Fecha y hora en que el pedido llegó a cada estado. */
  history: Partial<Record<OrderStatus, string>>;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  discount: number;
  coupon?: string;
  total: number;
  email: string;
  shippingData: ShippingData;
  payment: PaymentData;
  billing: BillingData;
  tracking?: { carrier: string; number: string; shippedAt: string; photo?: string };
  rejectionReason?: string;
  invoiceUrl?: string;
  /** true en pedidos creados en modo demostración (nunca son pedidos reales). */
  demo?: boolean;
};

export type Coupon = { code: string; value: number; createdAt: string; expiresAt: string; usedAt?: string; usedInOrder?: string };
export type CouponState = "disponible" | "usado" | "vencido";

export type PointsEntry = { id: string; date: string; reason: string; points: number };

export type MyReview = {
  id: string;
  orderId: string;
  productId: number;
  slug: string;
  productName: string;
  image?: string;
  rating: number;
  comment: string;
  date: string;
  photos?: number;
  pointsAwarded: number;
};

export type AccountData = {
  customer: Customer;
  addresses: SavedAddress[];
  billing: SavedBilling[];
  orders: Order[];
  coupons: Coupon[];
  points: PointsEntry[];
  reviews: MyReview[];
};

import type { AccountData, Customer, Order } from "@/types/account";

/**
 * Datos de EJEMPLO de una cuenta de cliente. Solo se cargan en modo demostración
 * (sin WooCommerce configurado) al iniciar sesión. No son pedidos ni pagos reales.
 */
const shippingData = {
  fullName: "Cliente de ejemplo",
  phone: "55550000",
  department: "Petén",
  municipality: "El Chal",
  zone: "Barrio El Paraíso",
  street: "Calle principal, casa 12",
  references: "Frente al parque central",
};
const billing = { name: "Cliente de ejemplo", dpi: "0000000000000" };

function demoOrders(email: string): Order[] {
  const base = { email, shippingData, billing, demo: true as const };
  return [
    {
      ...base,
      id: "02-40321",
      createdAt: "2026-11-18T09:12:00-06:00",
      status: "enviado",
      history: {
        esperando: "2026-11-18T09:12:00-06:00",
        confirmado: "2026-11-18T10:05:00-06:00",
        preparando: "2026-11-18T10:30:00-06:00",
        listo: "2026-11-18T12:40:00-06:00",
        transporte: "2026-11-18T13:15:00-06:00",
        enviado: "2026-11-18T15:20:00-06:00",
      },
      lines: [
        { productId: 103, slug: "cable-usb-c-a-lightning-1-m", name: "Cable USB-C a Lightning", detail: "1 m", unitPrice: 6500, quantity: 3 },
        { productId: 1054, slug: "protector-acrilico-color-negro", name: "Protector acrílico negro iPhone 16 Pro Max", detail: "Color negro", unitPrice: 10250, quantity: 2 },
      ],
      subtotal: 40000,
      shipping: 0,
      discount: 0,
      total: 40000,
      payment: { method: "transferencia", bank: "Banrural", reference: "123456", date: "2026-11-18" },
      tracking: { carrier: "Cargo Expreso", number: "000000000", shippedAt: "2026-11-18T15:20:00-06:00" },
    },
    {
      ...base,
      id: "02-27901",
      createdAt: "2026-11-15T16:40:00-06:00",
      status: "preparando",
      history: { esperando: "2026-11-15T16:40:00-06:00", confirmado: "2026-11-16T09:10:00-06:00", preparando: "2026-11-16T11:00:00-06:00" },
      lines: [{ productId: 102, slug: "cargador-20w-original-apple", name: "Cargador 20W original Apple", unitPrice: 18500, quantity: 2 }],
      subtotal: 37000,
      shipping: 0,
      discount: 0,
      total: 37000,
      payment: { method: "deposito", bank: "Banrural", reference: "884512", date: "2026-11-15" },
    },
    {
      ...base,
      id: "02-27824",
      createdAt: "2026-11-03T11:25:00-06:00",
      status: "entregado",
      history: {
        esperando: "2026-11-03T11:25:00-06:00",
        confirmado: "2026-11-03T14:00:00-06:00",
        preparando: "2026-11-04T09:00:00-06:00",
        listo: "2026-11-04T12:00:00-06:00",
        transporte: "2026-11-04T13:30:00-06:00",
        enviado: "2026-11-04T16:00:00-06:00",
        entregado: "2026-11-06T10:45:00-06:00",
      },
      lines: [{ productId: 101, slug: "protector-tpu-acrilico-con-magsafe-iphone-15-pro-max", name: "Protector TPU acrílico con MagSafe iPhone 15 Pro Max", unitPrice: 25000, quantity: 1 }],
      subtotal: 25000,
      shipping: 0,
      discount: 0,
      total: 25000,
      payment: { method: "deposito", bank: "Banrural", reference: "771203", date: "2026-11-03" },
      tracking: { carrier: "Cargo Expreso", number: "000000001", shippedAt: "2026-11-04T16:00:00-06:00" },
    },
  ];
}

export function demoAccount(customer: Customer): AccountData {
  return {
    customer: { firstName: customer.name, lastName: "", ...customer },
    addresses: [{ ...shippingData, id: "addr-casa", label: "Casa", email: customer.email, primary: true }],
    billing: [{ ...billing, id: "bill-cf" }],
    orders: demoOrders(customer.email),
    coupons: [
      { code: "NUVEX-8K2P", value: 2000, createdAt: "2026-11-10T10:00:00-06:00", expiresAt: "2026-12-10T23:59:59-06:00" },
      { code: "NUVEX-3HQ7", value: 1000, createdAt: "2026-09-20T10:00:00-06:00", expiresAt: "2026-10-20T23:59:59-06:00", usedAt: "2026-10-02T12:00:00-06:00", usedInOrder: "02-19876" },
      { code: "NUVEX-Z9M4", value: 1000, createdAt: "2026-08-01T10:00:00-06:00", expiresAt: "2026-08-31T23:59:59-06:00" },
    ],
    // Saldo: 625 − 100 − 100 − 200 + 25 = 250 pts.
    points: [
      { id: "p1", date: "2026-07-15T10:00:00-06:00", reason: "Ajuste de la tienda: saldo inicial de ejemplo", points: 625 },
      { id: "p2", date: "2026-08-01T10:00:00-06:00", reason: "Canje por cupón NUVEX-Z9M4", points: -100 },
      { id: "p3", date: "2026-09-20T10:00:00-06:00", reason: "Canje por cupón NUVEX-3HQ7", points: -100 },
      { id: "p4", date: "2026-11-06T10:45:00-06:00", reason: "Compra #02-27824 entregada", points: 25 },
      { id: "p5", date: "2026-11-10T10:00:00-06:00", reason: "Canje por cupón NUVEX-8K2P", points: -200 },
    ],
    reviews: [],
  };
}

/** Cupones de otras cuentas, para mostrar el error "pertenece a otra cuenta" en la demostración. */
export const demoForeignCoupons = ["NUVEX-4TQ1"];

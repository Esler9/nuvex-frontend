/**
 * Promociones y ajustes que la tienda administra desde /admin.
 * Montos fijos en centavos; porcentajes como enteros (5 = 5 %).
 */
export type PromotionType = "percent" | "fixed";
export type PromotionScope = "all" | "category" | "products";

export type Promotion = {
  id: string;
  name: string;
  type: PromotionType;
  value: number;
  scope: PromotionScope;
  categorySlugs: string[];
  productIds: number[];
  /** Solo clientes con sesión iniciada. */
  registeredOnly: boolean;
  /** ISO; opcionales. */
  startsAt?: string;
  endsAt?: string;
  active: boolean;
  createdAt: string;
};

export type StoreSettings = {
  /** Desde este total (centavos) la compra exige factura con NIT: no se permite Consumidor Final. */
  cfLimit: number;
};

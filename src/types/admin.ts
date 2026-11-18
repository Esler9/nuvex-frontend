/** Tipos de la API REST de administración de WooCommerce (wc/v3). Solo se usan en el servidor y en el panel /admin. */

export type WcStatus = "publish" | "draft" | "pending" | "private";
export type WcStockStatus = "instock" | "outofstock" | "onbackorder";

export type WcImage = { id: number; src: string; alt: string; name?: string };

export type WcAdminProduct = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  status: WcStatus | "trash" | "future";
  type: "simple" | "variable" | "grouped" | "external" | string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: WcStockStatus;
  short_description: string;
  description: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  images: WcImage[];
  date_modified: string;
};

export type WcAdminCategory = {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  count: number;
  image: WcImage | null;
};

export type Paginated<T> = { items: T[]; total: number; totalPages: number };

/** Cuerpo que se envía a wc/v3 al crear o actualizar un producto. */
export type WcProductInput = {
  name: string;
  status: WcStatus;
  sku?: string;
  regular_price?: string;
  sale_price?: string;
  manage_stock?: boolean;
  stock_quantity?: number | null;
  stock_status?: WcStockStatus;
  short_description?: string;
  description?: string;
  categories?: Array<{ id: number }>;
  images?: Array<{ id: number }>;
};

export type WcCategoryInput = {
  name: string;
  slug?: string;
  parent?: number;
  description?: string;
  /** { id: 0 } quita la imagen actual. */
  image?: { id: number };
};

/** Estado que devuelven las Server Actions de los formularios del panel. */
export type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

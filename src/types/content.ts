export type ProductCategoryRef = { id: number; name: string; slug: string };

export type Product = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  prices?: {
    price: string;
    regular_price: string;
    sale_price: string;
    currency_code: string;
    currency_minor_unit: number;
  };
  images?: Array<{ id: number; src: string; alt: string; thumbnail?: string }>;
  categories?: ProductCategoryRef[];
  on_sale?: boolean;
  /** Promedio de reseñas de WooCommerce, p. ej. "4.00". */
  average_rating?: string;
  review_count?: number;
  brands?: Array<{ id: number; name: string; slug: string }>;
  attributes?: ProductAttribute[];
  tags?: Array<{ id: number; name: string; slug: string }>;
  short_description?: string;
  description?: string;
  is_purchasable?: boolean;
  is_in_stock?: boolean;
  type?: string;
  sku?: string;
  /** Variaciones de un producto variable (Store API). */
  variations?: Array<{ id: number; attributes: Array<{ name: string; value: string }> }>;
  stock_availability?: { text: string; class: string };
  /** WooCommerce lo envía solo cuando quedan pocas unidades. */
  low_stock_remaining?: number | null;
};

export type ProductAttribute = {
  id: number;
  name: string;
  taxonomy?: string | null;
  has_variations?: boolean;
  terms: Array<{ id: number; name: string; slug: string; default?: boolean }>;
};

/** Variación resuelta (color, capacidad...) con su propio precio, existencia e imágenes. */
export type ProductOption = { id: number; label: string; product: Product };
export type ProductOptions = { title: string; kind: "color" | "pill"; items: ProductOption[]; defaultId: number } | null;

export type ProductReview = {
  id: number;
  reviewer: string;
  review: string;
  rating: number;
  verified: boolean;
  date_created: string;
  images?: Array<{ src: string; alt: string }>;
};

/** Información extraída de la descripción del producto en WooCommerce. */
export type ProductInfo = {
  introHtml: string;
  features: string[];
  specs: Array<[string, string]>;
  box: string[];
  warranty: string;
  faqs: Array<{ q: string; a: string }>;
  video: string | null;
};

export type Category = { id: number; name: string; slug: string; count: number; description?: string; image?: { src: string; alt: string } | null };

/** 1 = tarjeta toda blanca · 2 = imagen sobre fondo gris enmarcado. */
export type CardVariant = 1 | 2;

/** Categoría en círculo de la sección "Descubre más". */
export type DiscoverCategory = {
  label: string;
  slug: string;
  /** Ícono de respaldo mientras la categoría no tenga imagen en WooCommerce. */
  icon: "usb" | "otg" | "glass" | "mic" | "ram" | "headphones" | "charger" | "stand";
  image?: { src: string; alt: string } | null;
};

export type Article = {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
};

export type WpPage = {
  id: number;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
};

/** Tira de productos de una categoría en la página de inicio. */
export type HomeSection = { title: string; slug: string; cardVariant: CardVariant; products: Product[] };

/** Línea del carrito local. Los precios se guardan en unidades menores (centavos). */
export type CartLine = {
  id: number;
  name: string;
  slug: string;
  unitPrice: number;
  minorUnit: number;
  currency: string;
  image?: string;
  quantity: number;
  /** Opción elegida (color, capacidad...). */
  detail?: string;
};

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  cta: { label: string; href: string };
  tone: "pink" | "blue" | "white";
  /** Ícono decorativo mientras no haya imagen real. */
  icon: "smartphone" | "charger" | "truck";
  /** Reemplaza el placeholder con una imagen real: ruta en /public o URL. */
  image?: { src: string; alt: string };
};

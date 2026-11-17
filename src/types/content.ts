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
  images?: Array<{ id: number; src: string; alt: string }>;
  categories?: ProductCategoryRef[];
  short_description?: string;
  description?: string;
  is_purchasable?: boolean;
  is_in_stock?: boolean;
};

export type Category = { id: number; name: string; slug: string; count: number };

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
export type HomeSection = { title: string; slug: string; products: Product[] };

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

import type { CardVariant, HomeSection, Product } from "@/types/content";

/**
 * Catálogo de EJEMPLO. Solo se usa cuando WOOCOMMERCE_URL/WORDPRESS_URL no
 * están configurados (desarrollo o demostración). Nombres, precios, ofertas y
 * reseñas son placeholders y no representan inventario ni opiniones reales.
 */
const categories = {
  iphone: { id: 1, name: "Accesorios iPhone", slug: "accesorios-iphone" },
  samsung: { id: 2, name: "Accesorios Samsung", slug: "accesorios-samsung" },
  mix: { id: 3, name: "Adaptadores, memorias y más", slug: "adaptadores-memorias" },
};

type SampleInput = {
  id: number;
  name: string;
  price: number;
  regular?: number;
  category: keyof typeof categories;
  rating?: [number, number];
  brand?: string;
  freeShipping?: boolean;
};

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function sample({ id, name, price, regular, category, rating, brand, freeShipping }: SampleInput): Product {
  const now = String(price * 100);
  const before = String((regular ?? price) * 100);
  return {
    id,
    name,
    slug: slugify(name),
    permalink: "",
    prices: { price: now, regular_price: before, sale_price: now, currency_code: "GTQ", currency_minor_unit: 2 },
    images: [],
    categories: [categories[category]],
    on_sale: !!regular && regular > price,
    average_rating: rating ? rating[0].toFixed(2) : "0",
    review_count: rating ? rating[1] : 0,
    attributes: brand ? [{ id: 1, name: "Marca", terms: [{ id: 1, name: brand, slug: slugify(brand) }] }] : [],
    tags: freeShipping ? [{ id: 1, name: "Envío gratis", slug: "envio-gratis" }] : [],
    is_purchasable: true,
    is_in_stock: true,
  };
}

export const sampleProducts: Product[] = [
  sample({ id: 101, name: "Protector TPU acrílico con MagSafe iPhone 15 Pro Max", price: 250, regular: 300, category: "iphone", rating: [4, 3], brand: "TPU + acrílico", freeShipping: true }),
  sample({ id: 102, name: "Cargador 20W original Apple", price: 249, category: "iphone", rating: [4.8, 12], brand: "Apple" }),
  sample({ id: 103, name: "Cable USB-C a Lightning 1 m", price: 119, regular: 149, category: "iphone", rating: [4.5, 8], brand: "Apple" }),
  sample({ id: 104, name: "Funda de silicona iPhone 15", price: 149, category: "iphone", brand: "Silicona" }),
  sample({ id: 201, name: "Protector TPU transparente Galaxy S24 Ultra", price: 225, regular: 250, category: "samsung", rating: [4.2, 5], brand: "TPU", freeShipping: true }),
  sample({ id: 202, name: "Cargador 25W original Samsung", price: 199, category: "samsung", rating: [4.7, 9], brand: "Samsung" }),
  sample({ id: 203, name: "Cable USB-C a USB-C 1 m", price: 79, category: "samsung", rating: [4.3, 4], brand: "Samsung" }),
  sample({ id: 204, name: "Funda Galaxy A54", price: 95, regular: 119, category: "samsung", brand: "Policarbonato" }),
  sample({ id: 301, name: "Memoria microSD 64GB", price: 89, category: "mix", rating: [4.6, 15], brand: "Clase 10" }),
  sample({ id: 302, name: "Adaptador OTG USB-C a USB", price: 45, category: "mix", rating: [4.1, 6], brand: "Aluminio" }),
  sample({ id: 303, name: "Memoria USB 32GB", price: 59, regular: 69, category: "mix", brand: "USB 3.0" }),
  sample({ id: 304, name: "Adaptador de audio USB-C a 3.5 mm", price: 59, category: "mix", rating: [3.9, 2], brand: "Aluminio" }),
];

export function sampleByCategory(slug: string) {
  return sampleProducts.filter((p) => p.categories?.some((c) => c.slug === slug));
}

export function sampleSections(sections: Array<{ title: string; slug: string; cardVariant: CardVariant }>): HomeSection[] {
  return sections.map((s) => ({ ...s, products: sampleByCategory(s.slug) }));
}

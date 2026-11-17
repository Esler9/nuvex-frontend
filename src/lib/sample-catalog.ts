import type { HomeSection, Product } from "@/types/content";

/**
 * Catálogo de EJEMPLO. Solo se usa cuando WOOCOMMERCE_URL/WORDPRESS_URL no
 * están configurados (desarrollo o demostración). Los nombres y precios son
 * placeholders y no representan inventario real.
 */
const categories = {
  iphone: { id: 1, name: "Accesorios iPhone", slug: "accesorios-iphone" },
  samsung: { id: 2, name: "Accesorios Samsung", slug: "accesorios-samsung" },
  mix: { id: 3, name: "Adaptadores, memorias y más", slug: "adaptadores-memorias" },
};

function sample(id: number, name: string, priceQ: number, category: keyof typeof categories): Product {
  const price = String(priceQ * 100);
  return {
    id,
    name,
    slug: name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    permalink: "",
    prices: { price, regular_price: price, sale_price: price, currency_code: "GTQ", currency_minor_unit: 2 },
    images: [],
    categories: [categories[category]],
    is_purchasable: true,
    is_in_stock: true,
  };
}

export const sampleProducts: Product[] = [
  sample(101, "Protector iPhone 13 Pro Max", 75, "iphone"),
  sample(102, "Protector iPhone 14 Pro Max", 75, "iphone"),
  sample(103, "Cargador 20W original Apple", 249, "iphone"),
  sample(104, "Cable USB-C a Lightning", 129, "iphone"),
  sample(105, "Funda iPhone 15", 149, "iphone"),
  sample(201, "Protector Galaxy S23", 75, "samsung"),
  sample(202, "Cargador 25W original Samsung", 199, "samsung"),
  sample(203, "Cable USB-C", 79, "samsung"),
  sample(204, "Funda Galaxy A54", 119, "samsung"),
  sample(301, "Memoria microSD 64GB", 89, "mix"),
  sample(302, "Memoria USB 32GB", 69, "mix"),
  sample(303, "Adaptador USB-C a USB", 45, "mix"),
  sample(304, "Adaptador de audio", 59, "mix"),
];

export function sampleByCategory(slug: string) {
  return sampleProducts.filter((p) => p.categories?.some((c) => c.slug === slug));
}

export function sampleSections(sections: Array<{ title: string; slug: string }>): HomeSection[] {
  return sections.map((s) => ({ ...s, products: sampleByCategory(s.slug) }));
}

import type { CardVariant, HomeSection, Product, ProductReview } from "@/types/content";

/**
 * Catálogo de EJEMPLO. Solo se usa cuando WOOCOMMERCE_URL/WORDPRESS_URL no
 * están configurados (desarrollo o demostración). Nombres, precios, ofertas,
 * existencias y reseñas son placeholders y no representan datos reales.
 * Las imágenes son ilustraciones de marcador, no fotos de producto.
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

function prices(price: number, regular?: number): Product["prices"] {
  const now = String(price * 100);
  return { price: now, regular_price: String((regular ?? price) * 100), sale_price: now, currency_code: "GTQ", currency_minor_unit: 2 };
}

function sample({ id, name, price, regular, category, rating, brand, freeShipping }: SampleInput): Product {
  return {
    id,
    name,
    slug: slugify(name),
    permalink: "",
    prices: prices(price, regular),
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

/* ---------- Ilustraciones de marcador (SVG) ---------- */

function svg(body: string, bg: string) {
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${bg}"/>${body}<text x="200" y="380" font-family="sans-serif" font-size="14" fill="#9CA3AF" text-anchor="middle">Imagen de ejemplo</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(markup);
}

function caseArt(color: string, view: number) {
  const tilt = view === 1 ? "" : view === 2 ? ` transform="rotate(-12 200 200)"` : ` transform="translate(0 10) scale(0.92) translate(17 0)"`;
  return svg(`<g${tilt}><rect x="125" y="50" width="150" height="290" rx="30" fill="${color}"/><rect x="143" y="68" width="58" height="78" rx="16" fill="#ffffff" opacity=".22"/><circle cx="160" cy="92" r="11" fill="#1a1a1a" opacity=".55"/><circle cx="184" cy="122" r="11" fill="#1a1a1a" opacity=".55"/></g>`, "none");
}

function usbArt(capacity: string, view: number) {
  const tilt = view === 1 ? "" : view === 2 ? ` transform="rotate(-20 200 200)"` : ` transform="rotate(15 200 200)"`;
  return svg(`<g${tilt}><rect x="160" y="70" width="80" height="190" rx="18" fill="#1c1f3b"/><rect x="175" y="260" width="50" height="60" rx="6" fill="#c9ced8"/><rect x="185" y="275" width="10" height="10" fill="#1c1f3b"/><rect x="205" y="275" width="10" height="10" fill="#1c1f3b"/><circle cx="200" cy="95" r="9" fill="none" stroke="#c9ced8" stroke-width="4"/><text x="200" y="185" font-family="sans-serif" font-weight="700" font-size="22" fill="#ffffff" text-anchor="middle">${capacity}</text></g>`, "#ffffff");
}

const gallery = (make: (view: number) => string, label: string, baseId: number) =>
  [1, 2, 3].map((view) => ({ id: baseId + view, src: make(view), alt: `${label}, vista ${view}` }));

/* ---------- Producto 1: protector (estilo gris) ---------- */

const protectorColors = [
  { id: 1051, name: "Azul", slug: "azul", hex: "#3b5bdb", stock: 8 },
  { id: 1052, name: "Verde", slug: "verde", hex: "#2f9e44", stock: 6 },
  { id: 1053, name: "Gris", slug: "gris", hex: "#868e96", stock: 0 },
  { id: 1054, name: "Negro", slug: "negro", hex: "#1a1a1a", stock: 3 },
];

const protector: Product = {
  id: 105,
  name: "Protector acrílico color negro",
  slug: "protector-acrilico-color-negro",
  permalink: "",
  type: "variable",
  sku: "40F10C",
  prices: prices(250),
  images: gallery((v) => caseArt("#1a1a1a", v), "Protector acrílico negro", 10540),
  categories: [categories.iphone],
  average_rating: "5.00",
  review_count: 20,
  brands: [{ id: 1, name: "Spigen", slug: "spigen" }],
  attributes: [
    { id: 10, name: "Color", has_variations: true, terms: protectorColors.map((c, i) => ({ id: 100 + i, name: c.name, slug: c.slug, default: c.slug === "negro" })) },
    { id: 11, name: "Compatibilidad", has_variations: false, terms: [{ id: 110, name: "iPhone 16 Pro Max", slug: "iphone-16-pro-max" }] },
  ],
  tags: [{ id: 2, name: "Genérico", slug: "generico" }],
  variations: protectorColors.map((c) => ({ id: c.id, attributes: [{ name: "Color", value: c.slug }] })),
  is_in_stock: true,
  is_purchasable: true,
  low_stock_remaining: 3,
  description: `<h3>Características</h3><ul><li>Acrílico rígido con bordes de TPU</li><li>Protección de cámara elevada</li></ul>
<h3>Especificaciones</h3><table><tr><td>Material</td><td>Acrílico</td></tr><tr><td>Compatibilidad</td><td>iPhone 16 Pro Max</td></tr><tr><td>Color</td><td>Negro</td></tr></table>
<h3>Contenido de la caja</h3><ul><li>1 protector</li></ul>
<h3>Garantía</h3><p>24 horas después de haber recibido el producto.</p>
<h3>Preguntas frecuentes</h3><ul><li>¿Tiene los cortes para botones y cámara? Sí, deja libres los botones, el puerto de carga y la cámara.</li></ul>`,
};

/* ---------- Producto 2: memoria USB (estilo blanco) ---------- */

const usbCapacities = [
  { id: 3051, name: "32GB", price: 75, regular: undefined as number | undefined, stock: 9 },
  { id: 3052, name: "64GB", price: 95, regular: 120, stock: 12 },
  { id: 3053, name: "128GB", price: 165, regular: undefined, stock: 4 },
  { id: 3054, name: "256GB", price: 290, regular: undefined, stock: 0 },
];

const usb: Product = {
  id: 305,
  name: "Memoria USB Kingston DataTraveler Exodia 64GB USB 3.2",
  slug: "memoria-usb-kingston-datatraveler-exodia-64gb-usb-3-2",
  permalink: "",
  type: "variable",
  sku: "KDT64E",
  prices: prices(95, 120),
  on_sale: true,
  images: gallery((v) => usbArt("64GB", v), "Memoria USB Kingston 64GB", 30520),
  categories: [categories.mix],
  average_rating: "4.80",
  review_count: 35,
  brands: [{ id: 2, name: "Kingston", slug: "kingston" }],
  attributes: [{ id: 20, name: "Capacidad", has_variations: true, terms: usbCapacities.map((c, i) => ({ id: 200 + i, name: c.name, slug: c.name.toLowerCase(), default: c.name === "64GB" })) }],
  tags: [{ id: 3, name: "Original", slug: "original" }],
  variations: usbCapacities.map((c) => ({ id: c.id, attributes: [{ name: "Capacidad", value: c.name.toLowerCase() }] })),
  is_in_stock: true,
  is_purchasable: true,
  stock_availability: { text: "12 en existencia", class: "in-stock" },
  description: `<h3>Características</h3><ul><li>Velocidad USB 3.2 Gen 1</li><li>Tapa protectora y aro para llavero</li></ul>
<h3>Especificaciones</h3><table><tr><td>Capacidad</td><td>64GB</td></tr><tr><td>Conexión</td><td>USB-A 3.2</td></tr><tr><td>Compatibilidad</td><td>PC, Mac, TV, consolas</td></tr></table>
<h3>Contenido de la caja</h3><ul><li>1 memoria USB</li></ul>
<h3>Garantía</h3><p>1 año por defectos de fábrica.</p>
<h3>Preguntas frecuentes</h3><ul><li>¿Funciona en el carro? Sí, en estéreos con puerto USB que lean memorias en formato FAT32.</li></ul>`,
};

function stockFields(stock: number): Partial<Product> {
  return stock > 0
    ? { is_in_stock: true, stock_availability: { text: `${stock} en existencia`, class: "in-stock" }, low_stock_remaining: stock <= 5 ? stock : null }
    : { is_in_stock: false, stock_availability: { text: "Sin existencias", class: "out-of-stock" }, low_stock_remaining: null };
}

/** Detalle de cada variación (como lo devuelve /wc/store/v1/products/{id}). */
export const sampleVariations: Record<number, Product> = Object.fromEntries([
  ...protectorColors.map((c) => [
    c.id,
    { ...protector, id: c.id, type: "variation", sku: c.slug === "negro" ? "40F10C" : `40F10C-${c.slug.slice(0, 2).toUpperCase()}`, images: gallery((v) => caseArt(c.hex, v), `Protector acrílico ${c.name.toLowerCase()}`, c.id * 10), ...stockFields(c.stock) },
  ]),
  ...usbCapacities.map((c) => [
    c.id,
    { ...usb, id: c.id, type: "variation", sku: `KDT${c.name.replace("GB", "")}E`, prices: prices(c.price, c.regular), on_sale: !!c.regular, images: gallery((v) => usbArt(c.name, v), `Memoria USB Kingston ${c.name}`, c.id * 10), ...stockFields(c.stock) },
  ]),
]);

export const sampleReviews: Record<number, ProductReview[]> = {
  105: [
    {
      id: 1,
      reviewer: "",
      review: "El transporte tardó en entregar, pero el producto está perfecto.",
      rating: 4,
      verified: true,
      date_created: "2026-10-07T15:00:00",
      images: [{ src: caseArt("#1a1a1a", 2), alt: "Foto de ejemplo enviada por el cliente" }],
    },
  ],
  305: [{ id: 2, reviewer: "Carlos", review: "Original y rápida, la uso para pasar música al carro.", rating: 5, verified: true, date_created: "2026-11-12T10:00:00" }],
};

export const sampleProducts: Product[] = [
  protector,
  sample({ id: 101, name: "Protector TPU acrílico con MagSafe iPhone 15 Pro Max", price: 250, regular: 300, category: "iphone", rating: [4, 3], brand: "TPU + acrílico", freeShipping: true }),
  sample({ id: 102, name: "Cargador 20W original Apple", price: 249, category: "iphone", rating: [4.8, 12], brand: "Apple" }),
  sample({ id: 103, name: "Cable USB-C a Lightning 1 m", price: 119, regular: 149, category: "iphone", rating: [4.5, 8], brand: "Apple" }),
  sample({ id: 104, name: "Funda de silicona iPhone 15", price: 149, category: "iphone", brand: "Silicona" }),
  sample({ id: 106, name: "Vidrio templado iPhone 16 Pro Max", price: 75, category: "iphone", rating: [4.4, 6], brand: "Vidrio 9H" }),
  sample({ id: 201, name: "Protector TPU transparente Galaxy S24 Ultra", price: 225, regular: 250, category: "samsung", rating: [4.2, 5], brand: "TPU", freeShipping: true }),
  sample({ id: 202, name: "Cargador 25W original Samsung", price: 199, category: "samsung", rating: [4.7, 9], brand: "Samsung" }),
  sample({ id: 203, name: "Cable USB-C a USB-C 1 m", price: 79, category: "samsung", rating: [4.3, 4], brand: "Samsung" }),
  sample({ id: 204, name: "Funda Galaxy A54", price: 95, regular: 119, category: "samsung", brand: "Policarbonato" }),
  usb,
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

/**
 * Productos complementarios de EJEMPLO ("Te puede interesar" en la orden de compra).
 * Las variaciones usan el id del producto padre (protector 105x → 105, memoria 305x → 305).
 */
const sampleComplements: Record<number, number[]> = {
  101: [106, 102], 102: [103, 105, 106], 103: [102, 106], 104: [106, 103], 105: [106, 102], 106: [105, 103],
  201: [202, 203], 202: [203, 201], 203: [202], 204: [202, 203],
  301: [302], 302: [303, 301], 303: [302], 304: [203], 305: [302, 301],
};

export function sampleComplementsFor(ids: number[]): Product[] {
  const parent = (id: number) => (id > 1000 ? Math.floor(id / 10) : id);
  const inCart = new Set(ids.map(parent));
  const wanted = [...new Set(ids.flatMap((id) => sampleComplements[parent(id)] ?? []))].filter((id) => !inCart.has(id));
  return wanted.map((id) => sampleProducts.find((p) => p.id === id)).filter((p): p is Product => !!p);
}

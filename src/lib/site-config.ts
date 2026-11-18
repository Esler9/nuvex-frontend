import type { CardVariant, DiscoverCategory, HeroSlide } from "@/types/content";

/**
 * Ajustes editables de la tienda. Los textos marcados como "ejemplo" son
 * placeholders: reemplázalos por los datos reales antes de publicar.
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || "Nuvex",
  announcement: "Envíos a todo el país · Envío gratis a partir de Q350",
  /** Monto para envío gratis en centavos (Q350.00). Debe coincidir con la regla de envío en WooCommerce. */
  freeShippingThreshold: 35000,
  /** Solo dígitos con código de país, p. ej. 50212345678. */
  whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, ""),
  address: "Barrio El Paraíso, El Chal, Petén",
  social: {
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/",
    tiktok: "https://www.tiktok.com/",
  },
  /** Categorías del menú lateral. El slug debe existir en WooCommerce. */
  menuCategories: [
    { label: "Accesorios iPhone", slug: "accesorios-iphone" },
    { label: "Accesorios Samsung", slug: "accesorios-samsung" },
    { label: "Adaptadores", slug: "adaptadores" },
    { label: "Memorias y más", slug: "memorias" },
  ],
  /**
   * Tiras de productos de la página de inicio, en orden.
   * cardVariant es el estilo por defecto; se puede cambiar desde WooCommerce
   * escribiendo "tarjeta: 1" o "tarjeta: 2" en la descripción de la categoría.
   */
  homeSections: [
    { title: "Accesorios iPhone", slug: "accesorios-iphone", cardVariant: 2 },
    { title: "Accesorios Samsung", slug: "accesorios-samsung", cardVariant: 2 },
    { title: "Adaptadores, memorias y más", slug: "adaptadores-memorias", cardVariant: 1 },
  ] satisfies Array<{ title: string; slug: string; cardVariant: CardVariant }>,
  /** Etiqueta "Envío rápido" en tarjetas de productos disponibles. Pon enabled: false para ocultarla. */
  fastShipping: { enabled: true, label: "Envío rápido" },
  /** Slug de la etiqueta de producto en WooCommerce que marca "Envío gratis". */
  freeShippingTag: "envio-gratis",
  /**
   * Etiquetas de producto (Productos → Etiquetas en WooCommerce) que controlan la página de detalle:
   * original → insignia "Original [marca]"; generico → "Genérico de calidad";
   * sin-contra-entrega → oculta el pago contra entrega para ese producto.
   */
  productTags: { original: "original", generic: "generico", noCashOnDelivery: "sin-contra-entrega" },
  shipping: {
    carrier: "Cargo Expreso",
    /** Días hábiles (sin domingos) para la fecha estimada de entrega. */
    minDays: 2,
    maxDays: 3,
    timeZone: "America/Guatemala",
  },
  paymentMethods: ["Transferencia", "Depósito", "Contra entrega"] as const,
  /**
   * Sección "Descubre más" (círculos debajo de las categorías). El slug debe existir
   * en WooCommerce; la foto del círculo es la imagen de la categoría en WooCommerce.
   */
  discover: {
    title: "Descubre más",
    subtitle: "Encuentra todo lo que tu celular necesita",
    categories: [
      { label: "Memorias USB", slug: "memorias-usb", icon: "usb" },
      { label: "Adaptadores OTG", slug: "adaptadores-otg", icon: "otg" },
      { label: "Vidrios templados", slug: "vidrios-templados", icon: "glass" },
      { label: "Micrófonos inalámbricos", slug: "microfonos-inalambricos", icon: "mic" },
      { label: "Memorias RAM", slug: "memorias-ram", icon: "ram" },
      { label: "Audífonos", slug: "audifonos", icon: "headphones" },
      { label: "Cargadores", slug: "cargadores", icon: "charger" },
      { label: "Soportes", slug: "soportes", icon: "stand" },
    ] satisfies DiscoverCategory[],
  },
  helpLinks: [
    { label: "Preguntas frecuentes", href: "/preguntas-frecuentes" },
    { label: "Políticas de envío y garantía", href: "/politicas-de-envio-y-garantia" },
  ],
  legalLinks: [
    { label: "Términos y condiciones", href: "/terminos-y-condiciones" },
    { label: "Política de privacidad", href: "/politica-de-privacidad" },
    { label: "Política de garantía", href: "/politica-de-garantia" },
    { label: "Ayuda", href: "/ayuda" },
  ],
  slides: [
    {
      id: "iphone",
      eyebrow: "Nuevo en la tienda",
      title: "Protege tu iPhone con estilo",
      text: "Protectores, fundas y cargadores originales para tu modelo.",
      cta: { label: "Ver accesorios iPhone", href: "/productos?categoria=accesorios-iphone" },
      tone: "pink",
      icon: "smartphone",
    },
    {
      id: "samsung",
      eyebrow: "Carga rápida",
      title: "Todo para tu Samsung Galaxy",
      text: "Cargadores, cables y fundas para la línea Galaxy.",
      cta: { label: "Ver accesorios Samsung", href: "/productos?categoria=accesorios-samsung" },
      tone: "blue",
      icon: "charger",
    },
    {
      id: "envios",
      eyebrow: "Envíos a todo el país",
      title: "Envío gratis desde Q350",
      text: "Recibe tus accesorios en cualquier departamento de Guatemala.",
      cta: { label: "Explorar productos", href: "/productos" },
      tone: "white",
      icon: "truck",
    },
  ] satisfies HeroSlide[],
};

/** Enlace a WhatsApp con mensaje opcional, o null si no hay número configurado. */
export function whatsappLink(message?: string) {
  if (!siteConfig.whatsappNumber) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${siteConfig.whatsappNumber}${text}`;
}

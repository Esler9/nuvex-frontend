import type { DiscoverCategory, HeroSlide } from "@/types/content";

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
  address: "Dirección de ejemplo, Zona 10, Ciudad de Guatemala",
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
  /** Tiras de productos de la página de inicio, en orden. */
  homeSections: [
    { title: "Accesorios iPhone", slug: "accesorios-iphone" },
    { title: "Accesorios Samsung", slug: "accesorios-samsung" },
    { title: "Adaptadores, memorias y más", slug: "adaptadores-memorias" },
  ],
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

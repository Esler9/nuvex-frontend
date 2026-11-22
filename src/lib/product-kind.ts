/**
 * Tipo de producto deducido del nombre (y categorías, si se conocen). Solo se usa
 * para elegir el fondo de color temporal mientras el producto no tenga imagen.
 */
export type ProductKind = "protector" | "charger" | "cable" | "adapter" | "memory" | "headphones" | "mic" | "other";

const rules: [ProductKind, RegExp][] = [
  ["memory", /\b(memoria|micro ?sd|sd card|pendrive|usb flash)/],
  ["protector", /\b(protector|funda|mica|vidrio|templado|carcasa|case)\b/],
  ["adapter", /\b(adaptador|otg|convertidor)/],
  ["charger", /\b(cargador|cubo|power ?bank|carga rapida)/],
  ["cable", /\bcable/],
  ["headphones", /\b(audifono|auricular|earbud|airpod|headphone|diadema)/],
  ["mic", /\b(microfono|mic)\b/],
];

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export type Categories = (string | { name: string })[];

export function productKind(name: string, categories: Categories = []): ProductKind {
  const byName = normalize(name);
  for (const [kind, re] of rules) if (re.test(byName)) return kind;
  const byCategory = normalize(categories.map((c) => (typeof c === "string" ? c.replace(/-/g, " ") : c.name)).join(" "));
  for (const [kind, re] of rules) if (re.test(byCategory)) return kind;
  return "other";
}

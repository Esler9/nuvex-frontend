import { Cable, Headphones, MemoryStick, Mic, Package, Plug, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import { productKind, type Categories, type ProductKind } from "@/lib/product-kind";

/** Fondo pastel sólido + ícono en el tono fuerte del mismo color, por tipo de producto. */
const styles: Record<ProductKind, { bg: string; icon: string; Icon: LucideIcon }> = {
  protector: { bg: "bg-ph-lavender", icon: "text-ph-lavender-icon", Icon: ShieldCheck },
  charger: { bg: "bg-ph-orange", icon: "text-ph-orange-icon", Icon: Zap },
  cable: { bg: "bg-ph-teal", icon: "text-ph-teal-icon", Icon: Cable },
  adapter: { bg: "bg-ph-mint", icon: "text-ph-mint-icon", Icon: Plug },
  memory: { bg: "bg-ph-peach", icon: "text-ph-peach-icon", Icon: MemoryStick },
  headphones: { bg: "bg-ph-gold", icon: "text-ph-gold-icon", Icon: Headphones },
  mic: { bg: "bg-ph-gold", icon: "text-ph-gold-icon", Icon: Mic },
  other: { bg: "bg-ph-gold", icon: "text-ph-gold-icon", Icon: Package },
};

/** Clase de fondo temporal para un producto sin imagen. */
export function placeholderBg(name: string, categories?: Categories) {
  return styles[productKind(name, categories)].bg;
}

type Props = { name: string; categories?: Categories; iconClassName?: string };

/**
 * Ícono de contorno centrado para productos sin imagen. Rellena su contenedor;
 * el contenedor debe llevar el fondo de `placeholderBg` (mismo tamaño y radios).
 */
export function ProductImagePlaceholder({ name, categories, iconClassName = "size-10" }: Props) {
  const { icon, Icon } = styles[productKind(name, categories)];
  return <Icon aria-hidden className={`${iconClassName} ${icon}`} strokeWidth={1.5} />;
}

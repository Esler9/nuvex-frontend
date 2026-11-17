import { BadgeCheck } from "lucide-react";
import { productBadge } from "@/lib/product-meta";
import type { Product } from "@/types/content";

/** Insignia "Original [marca]" (azul sobre lavanda) o "Genérico de calidad" (gris). */
export function ProductBadge({ product, size = "md" }: { product: Product; size?: "sm" | "md" }) {
  const badge = productBadge(product);
  if (!badge) return null;
  const sizing = size === "sm" ? "gap-0.5 px-1.5 py-0.5 text-[10px] leading-3" : "gap-1 px-2.5 py-1 text-xs";
  const tone = badge.kind === "original" ? "bg-primary-soft text-primary-strong" : "bg-surface text-muted ring-1 ring-border";
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${sizing} ${tone}`}>
      {badge.kind === "original" && <BadgeCheck aria-hidden className={size === "sm" ? "size-3" : "size-3.5"} />}
      {badge.label}
    </span>
  );
}

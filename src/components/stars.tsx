import { Star } from "lucide-react";

/** Fila de 5 estrellas (decorativa; el valor se anuncia en texto aparte). */
export function Stars({ value, className = "size-4" }: { value: number; className?: string }) {
  const filled = Math.round(value);
  return (
    <span aria-hidden className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${className} ${i <= filled ? "fill-star text-star" : "fill-border text-border"}`} />
      ))}
    </span>
  );
}

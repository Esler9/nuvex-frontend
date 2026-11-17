"use client";

import { useRef, useState } from "react";
import { Smartphone } from "lucide-react";
import type { Product } from "@/types/content";

type Props = { images: NonNullable<Product["images"]>; name: string };

/** Galería deslizable con todas las imágenes del producto. */
export function ProductGallery({ images, name }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function goTo(i: number) {
    const track = trackRef.current;
    if (!track) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: i * track.clientWidth, behavior: smooth ? "smooth" : "auto" });
  }

  if (images.length === 0) {
    return (
      <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl bg-image-well text-muted">
        <Smartphone aria-hidden className="size-16 text-primary/50" strokeWidth={1.25} />
        <span className="text-sm">Imagen próximamente</span>
      </div>
    );
  }

  return (
    <div aria-roledescription="galería" aria-label={`Imágenes de ${name}`}>
      <div className="relative overflow-hidden rounded-xl bg-image-well">
        <div
          ref={trackRef}
          onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        >
          {images.map((img, i) => (
            <div key={img.id || i} className="aspect-square w-full shrink-0 snap-start" aria-label={`${i + 1} de ${images.length}`} role="group">
              <img
                src={img.src}
                alt={img.alt || `${name}, imagen ${i + 1}`}
                width={800}
                height={800}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                decoding="async"
                className="h-full w-full object-contain p-6"
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1 sm:hidden">
            {images.map((img, i) => (
              <button key={img.id || i} type="button" onClick={() => goTo(i)} aria-label={`Ver imagen ${i + 1}`} aria-current={i === index} className="grid size-7 place-items-center">
                <span className={`block h-2 rounded-full transition-all ${i === index ? "w-5 bg-primary" : "w-2 bg-foreground/25"}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="mt-3 hidden gap-2 sm:flex">
          {images.map((img, i) => (
            <li key={img.id || i}>
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ver imagen ${i + 1}`}
                aria-current={i === index}
                className={`size-16 overflow-hidden rounded-lg border-2 bg-image-well ${i === index ? "border-primary" : "border-transparent hover:border-border"}`}
              >
                <img src={img.thumbnail || img.src} alt="" width={64} height={64} loading="lazy" className="size-full object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

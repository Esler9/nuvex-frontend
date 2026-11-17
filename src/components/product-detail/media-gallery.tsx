"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize, Play, Smartphone, Volume2, VolumeX } from "lucide-react";
import type { Product } from "@/types/content";

type Slide = { type: "image"; src: string; alt: string } | { type: "video"; src: string };

type Props = {
  images: NonNullable<Product["images"]>;
  video: string | null;
  name: string;
  /** true = imagen dentro de caja gris (estilo gris); false = se funde con el blanco. */
  framed: boolean;
  actions?: ReactNode;
};

/** Galería deslizable de imágenes; el video (si hay) va en la segunda posición. */
export function MediaGallery({ images, video, name, framed, actions }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);

  const slides: Slide[] = images.map((img, i) => ({ type: "image", src: img.src, alt: img.alt || `${name}, imagen ${i + 1}` }));
  if (video) slides.splice(Math.min(1, slides.length), 0, { type: "video", src: video });
  const currentType = slides[index]?.type;

  // Reproduce sin sonido al llegar al video y lo pausa al salir.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (currentType === "video" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) el.play().catch(() => {});
    else el.pause();
  }, [currentType]);

  function goTo(i: number) {
    const track = trackRef.current;
    if (!track) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: i * track.clientWidth, behavior: smooth ? "smooth" : "auto" });
  }

  function toggleSound() {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
    if (el.paused) el.play().catch(() => {});
  }

  const box = framed ? "rounded-xl bg-image-well" : "";

  return (
    <div aria-roledescription="galería" aria-label={`Imágenes de ${name}`}>
      <div className="relative">
        {slides.length === 0 ? (
          <div className={`flex aspect-square flex-col items-center justify-center gap-2 text-muted ${framed ? box : "bg-card"}`}>
            <Smartphone aria-hidden className="size-16 text-primary/50" strokeWidth={1.25} />
            <span className="text-sm">Imagen próximamente</span>
          </div>
        ) : (
          <div className={`overflow-hidden ${box}`}>
            <div
              ref={trackRef}
              onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
              className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
            >
              {slides.map((slide, i) => (
                <div
                  key={slide.type + i}
                  role="group"
                  aria-roledescription="diapositiva"
                  aria-label={`${i + 1} de ${slides.length}`}
                  aria-hidden={i !== index}
                  inert={i !== index}
                  className="relative aspect-square w-full shrink-0 snap-center"
                >
                  {slide.type === "image" ? (
                    <img
                      src={slide.src}
                      alt={slide.alt}
                      width={800}
                      height={800}
                      loading={i === 0 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "high" : "auto"}
                      decoding="async"
                      className={`h-full w-full object-contain ${framed ? "p-6" : "p-2"}`}
                    />
                  ) : (
                    <>
                      <video ref={videoRef} src={slide.src} muted playsInline loop preload="metadata" aria-label={`Video de ${name}`} className="h-full w-full object-contain" />
                      <div className="absolute bottom-3 right-3 flex gap-2">
                        <button type="button" onClick={toggleSound} aria-label={muted ? "Activar sonido" : "Silenciar"} className="grid size-11 place-items-center rounded-full bg-navy/70 text-white">
                          {muted ? <VolumeX aria-hidden className="size-5" /> : <Volume2 aria-hidden className="size-5" />}
                        </button>
                        <button type="button" onClick={() => videoRef.current?.requestFullscreen?.().catch(() => {})} aria-label="Ver en pantalla completa" className="grid size-11 place-items-center rounded-full bg-navy/70 text-white">
                          <Maximize aria-hidden className="size-5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {actions && <div className="absolute right-2 top-2 z-10 flex flex-col gap-2">{actions}</div>}
      </div>

      {slides.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-0.5">
          {slides.map((slide, i) => {
            const active = i === index;
            return (
              <button
                key={slide.type + i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={slide.type === "video" ? "Ver video" : `Ver imagen ${i + 1}`}
                aria-current={active}
                className="grid h-8 min-w-7 place-items-center"
              >
                {slide.type === "video" ? (
                  <span className={`flex h-4 items-center justify-center rounded-full transition-all ${active ? "w-7 bg-primary text-white" : "w-4 bg-foreground/20 text-foreground"}`}>
                    <Play aria-hidden className="size-2.5" fill="currentColor" />
                  </span>
                ) : (
                  <span className={`block h-2 rounded-full transition-all ${active ? "w-6 bg-primary" : "w-2 bg-foreground/25"}`} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

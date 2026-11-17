"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BatteryCharging, Pause, Play, Smartphone, Truck } from "lucide-react";
import type { HeroSlide } from "@/types/content";

const INTERVAL_MS = 5000;
const icons = { smartphone: Smartphone, charger: BatteryCharging, truck: Truck };
const tones = {
  pink: "bg-primary-soft",
  blue: "bg-primary-soft",
  white: "bg-gradient-to-br from-primary-soft via-card to-primary-soft",
};

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: i * track.clientWidth, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    if (hovered || userPaused || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      const current = Math.round(track.scrollLeft / track.clientWidth);
      goTo((current + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [hovered, userPaused, slides.length, goTo]);

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Promociones"
      className="container-shell pt-4 sm:pt-6"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false);
      }}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
    >
      <div className="relative overflow-hidden rounded-xl">
        <div
          ref={trackRef}
          onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        >
          {slides.map((slide, i) => {
            const Icon = icons[slide.icon];
            return (
              <div
                key={slide.id}
                role="group"
                aria-roledescription="diapositiva"
                aria-label={`${i + 1} de ${slides.length}`}
                aria-hidden={i !== index}
                inert={i !== index}
                className={`grid w-full shrink-0 snap-start items-center gap-6 px-6 pb-14 pt-8 sm:px-12 md:min-h-[360px] md:grid-cols-[1.2fr_1fr] ${tones[slide.tone]}`}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.2em] text-primary-strong">{slide.eyebrow}</p>
                  <p className="mt-3 text-3xl font-black leading-tight tracking-[-.03em] sm:text-5xl">{slide.title}</p>
                  <p className="mt-3 max-w-md text-muted sm:text-lg">{slide.text}</p>
                  <Link href={slide.cta.href} className="mt-6 inline-flex min-h-12 items-center rounded-lg bg-primary-strong px-6 font-bold text-white transition-colors hover:bg-navy">
                    {slide.cta.label}
                  </Link>
                </div>
                <div className="hidden justify-center md:flex">
                  {slide.image ? (
                    <img src={slide.image.src} alt={slide.image.alt} width={360} height={360} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} className="aspect-square w-full max-w-xs rounded-xl object-cover" />
                  ) : (
                    <div aria-hidden className="grid aspect-square w-full max-w-[16rem] place-items-center rounded-full bg-card/80">
                      <Icon className="size-24 text-primary" strokeWidth={1.25} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {slides.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ir a la promoción ${i + 1}`}
                aria-current={i === index}
                className="grid size-8 place-items-center"
              >
                <span className={`block h-2 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-2 bg-foreground/25"}`} />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? "Reanudar carrusel" : "Pausar carrusel"}
              className="ml-1 grid size-8 place-items-center rounded-full text-foreground/60 hover:text-foreground"
            >
              {userPaused ? <Play aria-hidden className="size-3.5" /> : <Pause aria-hidden className="size-3.5" />}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

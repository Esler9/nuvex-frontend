"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

const KEY = "nuvex-scroll-v1";
const here = () => location.pathname + location.search;

function load(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

let positions: Record<string, number> | null = null;
/** URL a la que se regresó con atrás/adelante y cuya posición falta restaurar. */
let pendingRestore: string | null = null;

function restore() {
  if (!pendingRestore || pendingRestore !== here()) return;
  const y = (positions ??= load())[pendingRestore];
  pendingRestore = null;
  if (typeof y === "number") window.scrollTo({ top: y, left: 0, behavior: "instant" });
}

/**
 * Al regresar (botón atrás o gesto) devuelve al cliente exactamente al lugar donde estaba.
 * Se restaura en el mismo render que cambia la página, antes de que la transición tome la
 * imagen final, para que no se vea ningún salto.
 */
export function ScrollMemory() {
  const pathname = usePathname();

  useEffect(() => {
    positions = load();
    // La posición la restaura este componente; así el navegador no la mueve antes de tiempo.
    history.scrollRestoration = "manual";
    let frame = 0;
    const save = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (pendingRestore) return;
        (positions ??= {})[here()] = Math.round(window.scrollY);
        try {
          sessionStorage.setItem(KEY, JSON.stringify(positions));
        } catch {
          // Sin almacenamiento: la posición vive solo en memoria.
        }
      });
    };
    const onPop = (event: PopStateEvent & { hasUAVisualTransition?: boolean }) => {
      pendingRestore = here();
      // Si el navegador ya animó el gesto de regreso (Safari), no se anima otra vez.
      if (event.hasUAVisualTransition) {
        document.documentElement.dataset.vt = "off";
        window.setTimeout(() => delete document.documentElement.dataset.vt, 600);
      }
      // Cambios solo de parámetros (?categoria=) no cambian el pathname: se restaura tras pintar.
      requestAnimationFrame(() => requestAnimationFrame(restore));
    };
    window.addEventListener("scroll", save, { passive: true });
    window.addEventListener("popstate", onPop);
    return () => {
      history.scrollRestoration = "auto";
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", save);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  useLayoutEffect(() => {
    restore();
  }, [pathname]);

  return null;
}

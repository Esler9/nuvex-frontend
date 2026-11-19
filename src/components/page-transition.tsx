import { ViewTransition, type ReactNode } from "react";

export { ScrollMemory } from "@/components/scroll-memory";

/**
 * Transición tipo app entre páginas (View Transitions API vía React <ViewTransition>):
 * - "detail" (producto, detalle de compra): entra deslizándose desde la derecha y cubre la página
 *   anterior, que se queda quieta; al regresar sale hacia la derecha.
 * - "base" (listas y demás páginas): nunca se mueve, solo queda debajo.
 * Los enlaces de tarjetas usan transitionTypes={["nav-forward"]} para que de un detalle a otro
 * el anterior se quede quieto. Sin soporte del navegador o con "reducir movimiento", cambia sin animación.
 */
export function PageTransition({ kind = "base", children }: { kind?: "base" | "detail"; children: ReactNode }) {
  if (kind === "detail") {
    return (
      <ViewTransition enter={{ "nav-forward": "vt-slide-in", default: "vt-stay" }} exit={{ "nav-forward": "vt-stay", default: "vt-slide-out" }} default="none">
        <div className="min-h-svh bg-background">{children}</div>
      </ViewTransition>
    );
  }
  return (
    <ViewTransition enter="vt-stay" exit="vt-stay" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}

/** Tipo de transición para enlaces que abren un detalle (tarjeta de producto, compra). */
export const forward = ["nav-forward"];

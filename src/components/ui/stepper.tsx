import type { ReactNode } from "react";
import type { Tone } from "@/lib/order-status";

export type Step = {
  label: string;
  icon: ReactNode;
  state: "done" | "current" | "pending";
  /** Color del paso cuando no es el azul principal (naranja verificando, verde confirmado, rojo rechazado). */
  tone?: Tone;
  /** Texto pequeño debajo (fecha y hora del paso completado). */
  sub?: string;
  /** Solo para volver a pasos anteriores. */
  onSelect?: () => void;
};

const circle: Record<Tone, string> = {
  primary: "border-primary bg-primary text-white",
  accent: "border-accent bg-accent text-accent-foreground",
  success: "border-success bg-success text-white",
  danger: "border-danger bg-danger text-white",
};
const text: Record<Tone, string> = { primary: "text-primary-strong", accent: "text-accent-text", success: "text-success", danger: "text-danger" };

/** Barra de pasos con ícono y nombre, unidos por una línea (azul al completarse, gris pendiente). */
export function Stepper({ steps, label }: { steps: Step[]; label: string }) {
  return (
    <nav aria-label={label}>
      <ol className="grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, i) => {
          const active = step.state !== "pending";
          const tone = step.tone ?? "primary";
          const next = steps[i + 1];
          const inner = (
            <>
              <span className={`relative z-10 grid size-10 place-items-center rounded-full border-2 transition-colors sm:size-11 ${active ? circle[tone] : "border-pending bg-card text-pending"}`}>{step.icon}</span>
              <span className={`mt-2 block text-center text-xs font-semibold leading-tight sm:text-sm ${active ? text[tone] : "text-muted"}`}>{step.label}</span>
              {step.sub && <span className="mt-0.5 block text-center text-[11px] leading-tight text-muted sm:text-xs">{step.sub}</span>}
            </>
          );
          return (
            <li key={step.label} className="relative flex flex-col items-center px-1" aria-current={step.state === "current" ? "step" : undefined}>
              {next && <span aria-hidden className={`absolute left-1/2 top-5 h-0.5 w-full sm:top-[22px] ${next.state !== "pending" ? "bg-primary" : "bg-pending"}`} />}
              {step.onSelect ? (
                <button type="button" onClick={step.onSelect} className="flex flex-col items-center rounded-lg" aria-label={`Volver a ${step.label}`}>
                  {inner}
                </button>
              ) : (
                inner
              )}
              <span className="sr-only">{step.state === "done" ? ", completado" : step.state === "current" ? ", paso actual" : ", pendiente"}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

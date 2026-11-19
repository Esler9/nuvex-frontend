"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { formatDpi, maskDpi } from "@/lib/checkout";

/** DPI oculto excepto los últimos 4 dígitos, con un ojo para verlo completo. */
export function MaskedDpi({ dpi }: { dpi: string }) {
  const [shown, setShown] = useState(false);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="tabular-nums">DPI {shown ? formatDpi(dpi) : maskDpi(dpi)}</span>
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-pressed={shown}
        aria-label={shown ? "Ocultar DPI" : "Ver DPI completo"}
        className="-my-2 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground"
      >
        {shown ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
      </button>
    </span>
  );
}

"use client";

import { Copy } from "lucide-react";
import { useStore } from "@/components/store/store-provider";

/** Copia texto al portapapeles y avisa con un mensaje breve. */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function CopyButton({ text, label = "Copiar", notice = "Copiado", className = "" }: { text: string; label?: string; notice?: string; className?: string }) {
  const { notify } = useStore();
  return (
    <button
      type="button"
      onClick={async () => notify((await copyText(text)) ? notice : "No se pudo copiar. Selecciona el texto y cópialo manualmente.")}
      className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-semibold text-primary-strong transition-colors hover:bg-primary-soft ${className}`}
    >
      <Copy aria-hidden className="size-4" />
      {label}
    </button>
  );
}

"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "left" | "right" | "center";
  children: ReactNode;
  footer?: ReactNode;
};

const placement = {
  left: "sheet-left my-0 ml-0 mr-auto h-dvh max-h-none w-[min(88vw,22rem)]",
  right: "sheet-right my-0 mr-0 ml-auto h-dvh max-h-none w-[min(92vw,26rem)]",
  center: "sheet-center m-auto max-h-[90dvh] w-[min(92vw,26rem)] rounded-xl",
};

/** Panel modal basado en <dialog>: atrapa el foco, cierra con Esc y al tocar fuera. */
export function Sheet({ open, onClose, title, side = "left", children, footer }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={`${placement[side]} max-w-none overflow-hidden bg-card p-0 text-foreground shadow-2xl`}
    >
      <div className="flex h-full max-h-[inherit] flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-border py-2 pl-5 pr-2">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid size-11 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground">
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-border p-5">{footer}</div>}
      </div>
    </dialog>
  );
}

"use client";

import { Sheet } from "@/components/ui/sheet";
import { ui } from "@/components/ui/styles";

type Props = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Confirmación antes de acciones que no se pueden deshacer fácilmente. */
export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: Props) {
  return (
    <Sheet open={open} onClose={onCancel} title={title} side="center">
      {message && <p className="text-sm text-muted">{message}</p>}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" onClick={onCancel} className={ui.btnGhost}>
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} className={`${ui.btnBlue} min-h-11 text-sm`}>
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}

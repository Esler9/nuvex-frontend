import type { WcAdminProduct } from "@/types/admin";

export const statusLabel: Record<string, string> = {
  publish: "Publicado",
  draft: "Borrador",
  pending: "Pendiente",
  private: "Privado",
  future: "Programado",
  trash: "Papelera",
};

export function stockLabel(p: WcAdminProduct) {
  if (p.manage_stock && p.stock_quantity !== null) return p.stock_quantity > 0 ? `${p.stock_quantity} en existencia` : "Agotado";
  return { instock: "En existencia", outofstock: "Agotado", onbackorder: "Bajo pedido" }[p.stock_status] ?? p.stock_status;
}

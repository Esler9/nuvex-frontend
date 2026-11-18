import { CircleAlert, CircleCheck, CircleCheckBig, Clock, Package, PackageCheck, Smartphone, Truck, Check } from "lucide-react";
import type { OrderStatus } from "@/types/account";
import { statusMeta, toneClasses, type StatusIcon as IconName } from "@/lib/order-status";

const icons: Record<IconName, typeof Clock> = {
  clock: Clock,
  alert: CircleAlert,
  check: CircleCheck,
  box: Package,
  "box-check": PackageCheck,
  truck: Truck,
  "package-check": PackageCheck,
  "check-circle": CircleCheckBig,
};

export function StatusIcon({ name, className = "size-4" }: { name: IconName; className?: string }) {
  const Icon = icons[name] ?? Check;
  return <Icon aria-hidden className={className} />;
}

/** Píldora de estado del pedido con ícono. */
export function StatusPill({ status }: { status: OrderStatus }) {
  const meta = statusMeta[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[meta.tone]}`}>
      <StatusIcon name={meta.icon} className="size-3.5" />
      {meta.label}
    </span>
  );
}

/** Foto del producto o marcador accesible si no hay imagen real. */
export function ProductThumb({ src, size = "size-16", badge }: { src?: string; size?: string; badge?: number }) {
  return (
    <span className={`relative grid ${size} shrink-0 place-items-center rounded-xl bg-surface`}>
      {src ? <img src={src} alt="" width={64} height={64} loading="lazy" className="size-full rounded-xl object-contain p-1" /> : <Smartphone aria-hidden className="size-6 text-primary/50" />}
      {badge !== undefined && badge > 1 && (
        <span className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-primary-strong text-xs font-bold text-white" aria-label={`${badge} unidades`}>
          {badge}
        </span>
      )}
    </span>
  );
}

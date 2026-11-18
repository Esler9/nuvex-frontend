import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, description, action, back }: { title: string; description?: string; action?: { href: string; label: string }; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && <Link href={back.href} className="text-sm text-muted hover:text-foreground">← {back.label}</Link>}
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="inline-flex min-h-11 items-center rounded-lg bg-primary-strong px-5 text-sm font-semibold text-white hover:bg-navy">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "danger" | "info" }) {
  const styles = { neutral: "bg-surface text-muted", success: "bg-success/10 text-success", danger: "bg-danger/10 text-danger", info: "bg-primary-soft text-primary-strong" }[tone];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>{children}</span>;
}

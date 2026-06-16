import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ash">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-coal-800 bg-coal-900/60 p-5", className)}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-coal-800 bg-coal-900/60 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ash">{label}</span>
        {icon && <span className="text-ember-400">{icon}</span>}
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-cream">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ash-dark">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-coal-700 py-16 text-center">
      {icon && <div className="mb-3 text-ash-dark">{icon}</div>}
      <p className="font-medium text-cream">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ash">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

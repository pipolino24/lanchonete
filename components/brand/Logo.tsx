import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "full" | "emblem" | "stacked";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: { box: "h-8 w-8", icon: 16, title: "text-base", sub: "text-[9px]" },
  md: { box: "h-11 w-11", icon: 22, title: "text-xl", sub: "text-[10px]" },
  lg: { box: "h-16 w-16", icon: 32, title: "text-3xl", sub: "text-xs" },
};

export function Emblem({ size = "md", className }: { size?: LogoProps["size"]; className?: string }) {
  const s = sizes[size ?? "md"];
  return (
    <span
      className={cn(
        "relative grid place-items-center rounded-2xl bg-coal-850 ring-1 ring-coal-700 shadow-lg shadow-black/40",
        s.box,
        className,
      )}
    >
      <span className="absolute inset-0 rounded-2xl bg-gradient-to-b from-ember-500/15 to-transparent" />
      <Flame size={s.icon} className="relative text-ember-500" strokeWidth={2.2} fill="currentColor" />
    </span>
  );
}

export function Logo({ variant = "full", size = "md", className }: LogoProps) {
  const s = sizes[size ?? "md"];
  if (variant === "emblem") return <Emblem size={size} className={className} />;

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Emblem size={size} />
      <span className="flex flex-col leading-none">
        <span className={cn("font-display font-bold tracking-tight text-ember-500", s.title)}>
          CARIRI
        </span>
        <span
          className={cn(
            "font-display font-semibold uppercase tracking-[0.35em] text-cream/90",
            s.sub,
          )}
        >
          Burguer
        </span>
      </span>
    </span>
  );
}

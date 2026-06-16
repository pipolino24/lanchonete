import Image from "next/image";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "full" | "emblem" | "stacked";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const emblemSizes = {
  sm: { box: "h-8 w-8", icon: 16 },
  md: { box: "h-11 w-11", icon: 22 },
  lg: { box: "h-16 w-16", icon: 32 },
};

// Logo oficial (lockup completo: pão + chama + "CARIRI BURGUER")
// Variante para fundo escuro (carvão recolorido p/ creme); a original fica em /cariri-burguer-logo.png.
const LOGO = { src: "/cariri-burguer-logo-dark.png", w: 558, h: 447 };
const logoHeights = { sm: 32, md: 48, lg: 92 };

/** Emblema desenhado (chama em ladrilho de carvão) — para avatares circulares/compactos. */
export function Emblem({ size = "md", className }: { size?: LogoProps["size"]; className?: string }) {
  const s = emblemSizes[size ?? "md"];
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

/** Logotipo Cariri Burguer. `full`/`stacked` usam a arte oficial; `emblem` usa o emblema desenhado. */
export function Logo({ variant = "full", size = "md", className }: LogoProps) {
  if (variant === "emblem") return <Emblem size={size} className={className} />;

  const h = logoHeights[size ?? "md"];
  const w = Math.round(h * (LOGO.w / LOGO.h));

  return (
    <Image
      src={LOGO.src}
      alt="Cariri Burguer"
      width={w}
      height={h}
      priority
      className={cn("select-none", className)}
    />
  );
}

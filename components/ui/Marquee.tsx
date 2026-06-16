import { cn } from "@/lib/utils";

/** Faixa em rolagem infinita, com pausa no hover (estilo Magic UI Marquee). */
export function Marquee({
  children,
  speed = 40,
  className,
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  return (
    <div className={cn("marquee-pause group relative overflow-hidden", className)}>
      <div
        className="animate-marquee flex w-max gap-2 pr-2"
        style={{ "--marquee-duration": `${speed}s` } as React.CSSProperties}
      >
        {children}
        {children}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-coal-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-coal-950 to-transparent" />
    </div>
  );
}

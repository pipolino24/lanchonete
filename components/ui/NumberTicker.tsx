"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/money";

/** Anima a contagem de um número (estilo Magic UI NumberTicker). */
export function NumberTicker({
  value,
  format = "int",
  durationMs = 900,
  className,
}: {
  value: number;
  format?: "currency" | "int";
  durationMs?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    startRef.current = null;
    const step = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return (
    <span className={className}>
      {format === "currency" ? formatPrice(display) : display.toLocaleString("pt-BR")}
    </span>
  );
}

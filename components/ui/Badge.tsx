import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "ember" | "neutral" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  ember: "bg-ember-500/15 text-ember-400 ring-ember-500/25",
  neutral: "bg-coal-750 text-ash ring-coal-700",
  success: "bg-success/15 text-success ring-success/25",
  warning: "bg-warning/15 text-warning ring-warning/25",
  danger: "bg-danger/15 text-danger ring-danger/25",
  info: "bg-sky-500/15 text-sky-400 ring-sky-500/25",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

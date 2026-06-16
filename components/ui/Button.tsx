import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-ember-500 text-white hover:bg-ember-600 active:bg-ember-700 shadow-lg shadow-ember-600/20",
  secondary: "bg-coal-750 text-cream hover:bg-coal-700 ring-1 ring-coal-700",
  outline: "bg-transparent text-cream ring-1 ring-coal-600 hover:bg-coal-800",
  ghost: "bg-transparent text-ash hover:text-cream hover:bg-coal-800",
  danger: "bg-danger/90 text-white hover:bg-danger",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-lg gap-1.5",
  md: "h-11 px-5 text-sm rounded-xl gap-2",
  lg: "h-13 px-6 text-base rounded-xl gap-2",
  icon: "h-10 w-10 rounded-lg",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/60 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

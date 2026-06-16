"use client";

import { useState } from "react";
import { Clock, Minus, ChevronDown } from "lucide-react";
import { Emblem } from "@/components/brand/Logo";
import { ProductImage } from "@/components/store/ProductImage";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/money";
import { formatHoursByDay } from "@/lib/store-hours";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  coverUrl?: string | null;
  logoUrl?: string | null;
  isOpen: boolean;
  minOrder: number;
  hours: { weekday: number; openTime: string; closeTime: string; active: boolean }[];
};

export function StoreHeader({ name, coverUrl, logoUrl, isOpen, minOrder, hours }: Props) {
  const [showHours, setShowHours] = useState(false);
  const days = formatHoursByDay(hours);
  const today = new Date().getDay();

  return (
    <header className="relative">
      {/* Capa */}
      <div className="relative h-44 w-full overflow-hidden sm:h-60 lg:h-72">
        <ProductImage src={coverUrl} alt={name} emoji="🔥" className="!rounded-none" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-coal-950 via-coal-950/40 to-transparent" />
      </div>

      {/* Cartão de identidade */}
      <div className="relative mx-auto -mt-14 max-w-7xl px-4 lg:px-6">
        <div className="surface rounded-2xl p-4 shadow-warm backdrop-blur lg:p-5">
          <div className="flex items-start gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-2 ring-ember-500/30 shadow-lg shadow-ember-600/20 lg:h-20 lg:w-20">
              {logoUrl ? (
                <ProductImage src={logoUrl} alt={name} emoji="🍔" sizes="80px" />
              ) : (
                <Emblem size="lg" className="!h-full !w-full !rounded-2xl" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-bold leading-tight text-cream">{name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge tone={isOpen ? "success" : "danger"}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", isOpen ? "bg-success" : "bg-danger")} />
                  {isOpen ? "Aberto agora" : "Fechado"}
                </Badge>
                <span className="inline-flex items-center gap-1 text-xs text-ash">
                  <Minus size={13} /> Pedido mínimo {formatPrice(minOrder)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowHours((v) => !v)}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ember-400 hover:bg-coal-800"
            >
              <Clock size={14} /> Horários
              <ChevronDown size={14} className={cn("transition-transform", showHours && "rotate-180")} />
            </button>
          </div>

          {showHours && (
            <div className="mt-3 animate-fade-in border-t border-coal-700 pt-3">
              <ul className="grid gap-1 text-sm">
                {days.map((d, i) => (
                  <li
                    key={d.label}
                    className={cn(
                      "flex justify-between",
                      i === today ? "text-cream" : "text-ash",
                    )}
                  >
                    <span>{d.label}</span>
                    <span>{d.periods.length ? d.periods.join(", ") : "Fechado"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

"use client";

import NumberFlow from "@number-flow/react";

/** Total/valor em centavos exibido como R$ com transição animada de dígitos. */
export function PriceFlow({ cents, className }: { cents: number; className?: string }) {
  return (
    <NumberFlow
      value={cents / 100}
      format={{ style: "currency", currency: "BRL", minimumFractionDigits: 2 }}
      locales="pt-BR"
      className={className}
    />
  );
}

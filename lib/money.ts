/** Formata centavos como moeda BRL. Ex: 3900 -> "R$ 39,00" */
export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Formata centavos sem o símbolo. Ex: 3900 -> "39,00" */
export function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte um texto digitado ("39,00", "R$ 1.299,90") em centavos.
 * Nunca retorna negativo — preços/taxas/descontos são sempre ≥ 0
 * (evita preço/desconto negativo corromper o pedido).
 */
export function parseToCents(input: string | number): number {
  if (typeof input === "number") return Math.max(0, Math.round(input * 100));
  const cleaned = input
    .replace(/[^0-9.,]/g, "") // remove tudo menos dígitos, ponto e vírgula (sem sinal)
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const value = parseFloat(cleaned);
  return Number.isNaN(value) || value < 0 ? 0 : Math.round(value * 100);
}

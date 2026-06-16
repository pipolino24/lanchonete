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

/** Converte um texto digitado ("39,00", "R$ 1.299,90") em centavos. */
export function parseToCents(input: string | number): number {
  if (typeof input === "number") return Math.round(input * 100);
  const cleaned = input
    .replace(/[^0-9.,-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const value = parseFloat(cleaned);
  return Number.isNaN(value) ? 0 : Math.round(value * 100);
}

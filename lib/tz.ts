/**
 * Limites de dia/mês no fuso de Brasília (UTC-3, sem horário de verão atualmente).
 * O servidor roda em UTC; sem isso, "hoje" começa às 21h do dia anterior (BRT)
 * e os pedidos das 21h–23h59 caem no dia errado dos relatórios.
 */
const BR_OFFSET = "-03:00";

function ymdBR(d: Date): string {
  // en-CA => "YYYY-MM-DD"
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
}

/** Início do dia de hoje (00:00 BRT) como Date. */
export function startOfTodayBR(now: Date = new Date()): Date {
  return new Date(`${ymdBR(now)}T00:00:00.000${BR_OFFSET}`);
}

/** Início do dia há N dias (00:00 BRT). */
export function startOfDaysAgoBR(days: number, now: Date = new Date()): Date {
  return new Date(startOfTodayBR(now).getTime() - days * 86400000);
}

/** Início do mês atual (dia 1, 00:00 BRT). */
export function startOfMonthBR(now: Date = new Date()): Date {
  return new Date(`${ymdBR(now).slice(0, 7)}-01T00:00:00.000${BR_OFFSET}`);
}

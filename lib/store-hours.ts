type Hour = { weekday: number; openTime: string; closeTime: string; active: boolean };

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Determina se a loja está aberta agora com base nos períodos. */
export function isOpenNow(hours: Hour[], now = new Date()): boolean {
  const weekday = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return hours.some((h) => {
    if (!h.active || h.weekday !== weekday) return false;
    const open = toMinutes(h.openTime);
    const close = toMinutes(h.closeTime);
    if (close <= open) {
      // vira a meia-noite
      return minutes >= open || minutes <= close;
    }
    return minutes >= open && minutes <= close;
  });
}

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function formatHoursByDay(hours: Hour[]) {
  return WEEKDAYS.map((label, weekday) => {
    const periods = hours
      .filter((h) => h.weekday === weekday && h.active)
      .map((h) => `${h.openTime} às ${h.closeTime}`);
    return { label, periods };
  });
}

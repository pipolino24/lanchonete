/**
 * Geocodificação via OpenStreetMap / Nominatim (grátis, sem chave) + distância.
 *
 * Política de uso do Nominatim: máx. ~1 req/s, User-Agent identificável.
 * As respostas são cacheadas pelo Next (revalidate) para não repetir buscas.
 */

export type LatLng = { lat: number; lng: number };

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

export async function geocode(query: string): Promise<LatLng | null> {
  const q = query.trim();
  if (q.length < 4) return null;
  try {
    const url = `${NOMINATIM}?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "CaririBurguer/1.0 (pedidos cariri burguer)",
        "Accept-Language": "pt-BR",
      },
      // cache por 7 dias — endereços não mudam de lugar
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data?.length) return null;
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

/** Tenta várias consultas (da mais específica à mais genérica) e retorna a 1ª que resolver. */
export async function geocodeFirst(queries: string[]): Promise<LatLng | null> {
  const list = [...new Set(queries.filter((q) => q && q.trim().length >= 5))];
  for (let i = 0; i < list.length; i++) {
    const r = await geocode(list[i]);
    if (r) return r;
    if (i < list.length - 1) await new Promise((res) => setTimeout(res, 350)); // respeita ~1 req/s
  }
  return null;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Distância em km entre dois pontos (Haversine). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

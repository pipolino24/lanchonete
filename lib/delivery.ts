import { prisma } from "@/lib/prisma";
import { geocodeFirst, haversineKm, type LatLng } from "@/lib/geo";
import type { Store } from "@prisma/client";

type AddressParts = {
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
};

/** Consultas do mais específico ao mais genérico (OSM costuma falhar no endereço exato). */
function candidateQueries(p: AddressParts): string[] {
  const st = p.street?.trim();
  const num = p.number?.trim();
  const bairro = p.neighborhood?.trim();
  const city = p.city?.trim();
  const uf = p.state?.trim();
  const cep = p.zipCode?.replace(/\D/g, "");
  const tail = [city, uf, "Brasil"].filter(Boolean).join(", ");
  const out: string[] = [];
  if (st && num) out.push([`${st}, ${num}`, bairro, tail].filter(Boolean).join(", "));
  if (st) out.push([st, bairro, tail].filter(Boolean).join(", "));
  if (st) out.push([st, tail].filter(Boolean).join(", "));
  if (bairro) out.push([bairro, tail].filter(Boolean).join(", "));
  if (cep && cep.length === 8) out.push(`${cep}, ${tail}`);
  if (city) out.push(tail);
  return out;
}

export type QuoteAddress = {
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
};

export type DeliveryQuote = {
  served: boolean; // dentro da área de entrega
  free: boolean;
  fee: number; // centavos (0 se grátis)
  distanceKm: number | null;
  etaMinutes: number;
  estimated: boolean; // true = não geocodificou, taxa aproximada
  reason: string | null; // motivo quando served=false, ou observação
};

const DIACRITICS = /[̀-ͯ]/g;
function norm(s?: string | null): string {
  return (s ?? "").normalize("NFD").replace(DIACRITICS, "").trim().toLowerCase();
}

/** Coordenadas da loja: usa lat/lng salvos ou geocodifica o endereço (e salva). */
async function storeOrigin(store: Store): Promise<LatLng | null> {
  if (store.lat != null && store.lng != null) return { lat: store.lat, lng: store.lng };
  const o = await geocodeFirst(candidateQueries(store));
  if (o) {
    await prisma.store
      .update({ where: { id: store.id }, data: { lat: o.lat, lng: o.lng } })
      .catch(() => {});
  }
  return o;
}

/**
 * Calcula a taxa de entrega de verdade a partir da configuração da loja e do
 * endereço do cliente. Usado tanto na prévia do checkout quanto na criação do
 * pedido (fonte da verdade).
 */
export async function quoteDelivery(
  store: Store,
  address: QuoteAddress | null | undefined,
  subtotal: number,
  opts?: { couponFreeShipping?: boolean },
): Promise<DeliveryQuote> {
  const baseEta = store.prepTime ?? 40;
  const addr = address ?? {};

  // Regras globais de gratuidade
  const freeByValue = store.freeShippingAbove != null && subtotal >= store.freeShippingAbove;
  const freeByNeighborhood =
    !!addr.neighborhood && store.freeNeighborhoods.map(norm).includes(norm(addr.neighborhood));
  const freeGlobal = freeByValue || freeByNeighborhood || !!opts?.couponFreeShipping;

  // ── Modo POR KM ──────────────────────────────────────────────
  if (store.deliveryMode === "KM") {
    const origin = await storeOrigin(store);
    const dest = origin ? await geocodeFirst(candidateQueries(addr)) : null;

    // Não conseguiu localizar → taxa estimada (base), mas ainda atende
    if (!origin || !dest) {
      return {
        served: true,
        free: freeGlobal,
        fee: freeGlobal ? 0 : store.baseDeliveryFee,
        distanceKm: null,
        etaMinutes: baseEta,
        estimated: true,
        reason: freeGlobal
          ? null
          : "Não localizamos o endereço exato — taxa estimada, confirmada no preparo.",
      };
    }

    const distanceKm = Math.round(haversineKm(origin, dest) * 10) / 10;

    if (store.maxDeliveryKm != null && distanceKm > store.maxDeliveryKm) {
      return {
        served: false,
        free: false,
        fee: 0,
        distanceKm,
        etaMinutes: baseEta,
        estimated: false,
        reason: `Fora da área de entrega (até ${store.maxDeliveryKm} km).`,
      };
    }

    const freeByRadius = store.freeRadiusKm != null && distanceKm <= store.freeRadiusKm;
    const free = freeGlobal || freeByRadius;
    const fee = free ? 0 : store.baseDeliveryFee + Math.round(store.feePerKm * distanceKm);

    return { served: true, free, fee, distanceKm, etaMinutes: baseEta, estimated: false, reason: null };
  }

  // ── Modo POR BAIRRO / TAXA FIXA ──────────────────────────────
  const zones = await prisma.deliveryZone.findMany({
    where: { storeId: store.id, active: true },
    orderBy: [{ position: "asc" }, { fee: "asc" }],
  });

  if (store.deliveryMode === "FIXED") {
    const zone = zones[0];
    const baseFee = zone?.fee ?? 0;
    const free = freeGlobal || baseFee === 0;
    return {
      served: true,
      free,
      fee: free ? 0 : baseFee,
      distanceKm: null,
      etaMinutes: zone?.etaMinutes ?? baseEta,
      estimated: false,
      reason: null,
    };
  }

  // NEIGHBORHOOD — casa o bairro do cliente com a zona cadastrada
  const match = zones.find((z) => norm(z.label) === norm(addr.neighborhood));
  if (!match) {
    return {
      served: false,
      free: false,
      fee: 0,
      distanceKm: null,
      etaMinutes: baseEta,
      estimated: false,
      reason: addr.neighborhood
        ? `Ainda não entregamos no bairro ${addr.neighborhood}.`
        : "Informe o bairro para calcular a entrega.",
    };
  }
  const free = freeGlobal || match.fee === 0;
  return {
    served: true,
    free,
    fee: free ? 0 : match.fee,
    distanceKm: null,
    etaMinutes: match.etaMinutes,
    estimated: false,
    reason: null,
  };
}

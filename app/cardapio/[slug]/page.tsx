import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStoreBySlug } from "@/lib/queries";
import { isOpenNow } from "@/lib/store-hours";
import { StoreView, type StoreViewData } from "@/components/store/StoreView";

export const dynamic = "force-dynamic";

export default async function CardapioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const [payments, cheapestZone] = await Promise.all([
    prisma.paymentConfig.findMany({ where: { storeId: store.id } }),
    prisma.deliveryZone.findFirst({
      where: { storeId: store.id, active: true },
      orderBy: { fee: "asc" },
    }),
  ]);

  const featured = store.categories
    .flatMap((c) => c.products)
    .filter((p) => p.featured)
    .slice(0, 8);

  const data: StoreViewData = {
    slug: store.slug,
    name: store.name,
    coverUrl: store.coverUrl,
    logoUrl: store.logoUrl,
    minOrder: store.minOrder,
    freeShippingAbove: store.freeShippingAbove,
    isOpen: isOpenNow(store.hours),
    deliveryFeePreview: cheapestZone?.fee ?? 0,
    hours: store.hours.map((h) => ({
      weekday: h.weekday,
      openTime: h.openTime,
      closeTime: h.closeTime,
      active: h.active,
    })),
    categories: store.categories.map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      products: c.products,
    })),
    featured,
    payments: payments.map((p) => ({
      method: p.method,
      enabledDelivery: p.enabledDelivery,
      enabledPickup: p.enabledPickup,
    })),
  };

  return <StoreView data={data} />;
}

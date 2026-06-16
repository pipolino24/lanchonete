import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";
import { PdvForm, type PdvCategory } from "@/components/admin/pdv/PdvForm";
import { criarPedidoPdv } from "./actions";

export const dynamic = "force-dynamic";

export default async function PdvPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string; type?: string }>;
}) {
  const session = await requireSession();
  const { table, type } = await searchParams;

  const categories = await prisma.category.findMany({
    where: { storeId: session.storeId, active: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      emoji: true,
      products: {
        where: { active: true },
        orderBy: [{ position: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          price: true,
          promoPrice: true,
          images: true,
        },
      },
    },
  });

  const data: PdvCategory[] = categories
    .map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      products: c.products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.promoPrice ?? p.price,
        image: p.images[0] ?? null,
      })),
    }))
    .filter((c) => c.products.length > 0);

  const initialType =
    type === "DELIVERY" || type === "PICKUP" || type === "DINEIN"
      ? (type as "DELIVERY" | "PICKUP" | "DINEIN")
      : "DINEIN";

  return (
    <>
      <PageHeader
        title="PDV / Nova venda"
        subtitle="Monte um pedido manualmente e registre a venda no balcão."
      />

      <PdvForm
        categories={data}
        initialTable={table ?? ""}
        initialType={initialType}
        action={criarPedidoPdv}
      />
    </>
  );
}

import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProdutoForm } from "@/components/admin/produtos/ProdutoForm";
import { salvarProduto, excluirProduto } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const isNew = id === "novo";

  const [categories, groups, product] = await Promise.all([
    prisma.category.findMany({
      where: { storeId: session.storeId },
      orderBy: { position: "asc" },
      select: { id: true, name: true, emoji: true },
    }),
    prisma.complementGroup.findMany({
      where: { storeId: session.storeId },
      orderBy: { position: "asc" },
      select: { id: true, title: true },
    }),
    isNew
      ? Promise.resolve(null)
      : prisma.product.findFirst({
          where: { id, storeId: session.storeId },
          include: {
            complementLinks: {
              select: { groupId: true, required: true, min: true, max: true },
            },
          },
        }),
  ]);

  if (!isNew && !product) {
    notFound();
  }

  const initial = product
    ? {
        id: product.id,
        type: product.type,
        categoryId: product.categoryId,
        name: product.name,
        description: product.description,
        price: product.price,
        promoPrice: product.promoPrice,
        imageUrl: product.images[0] ?? "",
        measureValue: product.measureValue,
        measureUnit: product.measureUnit,
        serves: product.serves,
        stock: product.stock,
        pdvCode: product.pdvCode,
        availableDelivery: product.availableDelivery,
        availableDineIn: product.availableDineIn,
        featured: product.featured,
        active: product.active,
        removableIngredients: product.removableIngredients,
        groupIds: product.complementLinks.map((l) => l.groupId),
        groupRules: Object.fromEntries(
          product.complementLinks.map((l) => [
            l.groupId,
            { required: l.required, min: l.min, max: l.max },
          ]),
        ),
      }
    : null;

  return (
    <ProdutoForm
      initial={initial}
      categories={categories}
      groups={groups}
      onSave={salvarProduto}
      onDelete={excluirProduto}
    />
  );
}

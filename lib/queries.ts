import { prisma } from "@/lib/prisma";

/** Loja + cardápio completo para a vitrine do cliente (sem complementos). */
export async function getStoreBySlug(slug: string) {
  return prisma.store.findUnique({
    where: { slug },
    include: {
      hours: { orderBy: { weekday: "asc" } },
      categories: {
        where: { active: true },
        orderBy: { position: "asc" },
        include: {
          products: {
            where: { active: true },
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });
}

export type StoreWithMenu = NonNullable<Awaited<ReturnType<typeof getStoreBySlug>>>;
export type MenuCategory = StoreWithMenu["categories"][number];
export type MenuProduct = MenuCategory["products"][number];

/** Detalhe de um produto com grupos de adicionais (para o modal). */
export async function getProductDetail(productId: string) {
  return prisma.product.findUnique({
    where: { id: productId },
    include: {
      complementLinks: {
        orderBy: { position: "asc" },
        include: {
          group: {
            include: {
              items: {
                where: { active: true },
                orderBy: { position: "asc" },
              },
            },
          },
        },
      },
    },
  });
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductDetail>>>;

/** Produtos em destaque da loja. */
export async function getFeaturedProducts(storeId: string) {
  return prisma.product.findMany({
    where: { storeId, active: true, featured: true },
    orderBy: { position: "asc" },
    take: 8,
  });
}

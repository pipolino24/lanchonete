"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProductType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { parseToCents } from "@/lib/money";

const PRODUCT_TYPES: ProductType[] = ["COMMON", "COMBO", "PIZZA", "WEIGHT"];

function toProductType(value: FormDataEntryValue | null): ProductType {
  const v = String(value ?? "").toUpperCase();
  return (PRODUCT_TYPES as string[]).includes(v) ? (v as ProductType) : "COMMON";
}

function str(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function optStr(value: FormDataEntryValue | null): string | null {
  const v = str(value);
  return v.length ? v : null;
}

function optInt(value: FormDataEntryValue | null): number | null {
  const v = str(value);
  if (!v.length) return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

function nonNegInt(value: FormDataEntryValue | null): number {
  const n = parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function csvList(value: FormDataEntryValue | null): string[] {
  return str(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function criarCategoria(formData: FormData) {
  const session = await requireSession();
  const name = str(formData.get("name"));
  if (!name) return;
  const emoji = optStr(formData.get("emoji"));

  const last = await prisma.category.findFirst({
    where: { storeId: session.storeId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.category.create({
    data: {
      storeId: session.storeId,
      name,
      emoji: emoji ?? undefined,
      position: (last?.position ?? -1) + 1,
    },
  });

  revalidatePath("/painel/produtos");
}

export async function salvarProduto(formData: FormData) {
  const session = await requireSession();

  const id = str(formData.get("id"));
  const isNew = !id || id === "novo";

  const categoryId = str(formData.get("categoryId"));
  const name = str(formData.get("name"));
  if (!categoryId || !name) {
    // categoria e nome são obrigatórios
    return;
  }

  // Garante que a categoria pertence à loja (multi-tenant)
  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId: session.storeId },
    select: { id: true },
  });
  if (!category) return;

  const imageUrl = optStr(formData.get("imageUrl"));
  const images = imageUrl ? [imageUrl] : [];

  const priceCents = parseToCents(str(formData.get("price")));
  const promoRaw = str(formData.get("promoPrice"));
  const promoPrice = promoRaw.length ? parseToCents(promoRaw) : null;

  const data = {
    type: toProductType(formData.get("type")),
    categoryId,
    name,
    description: optStr(formData.get("description")),
    price: priceCents,
    promoPrice,
    images,
    measureValue: optStr(formData.get("measureValue")),
    measureUnit: optStr(formData.get("measureUnit")),
    serves: optInt(formData.get("serves")),
    stock: optInt(formData.get("stock")),
    pdvCode: optStr(formData.get("pdvCode")),
    availableDelivery: formData.get("availableDelivery") != null,
    availableDineIn: formData.get("availableDineIn") != null,
    featured: formData.get("featured") != null,
    active: formData.get("active") != null,
    removableIngredients: csvList(formData.get("removableIngredients")),
  };

  // Grupos de adicionais selecionados (checkboxes name="groupIds")
  const groupIds = formData
    .getAll("groupIds")
    .map((g) => String(g))
    .filter(Boolean);

  // Valida que os grupos pertencem à loja
  const validGroups = groupIds.length
    ? await prisma.complementGroup.findMany({
        where: { id: { in: groupIds }, storeId: session.storeId },
        select: { id: true },
      })
    : [];
  const validGroupIds = validGroups.map((g) => g.id);

  let productId: string;

  if (isNew) {
    const last = await prisma.product.findFirst({
      where: { storeId: session.storeId, categoryId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const created = await prisma.product.create({
      data: {
        storeId: session.storeId,
        position: (last?.position ?? -1) + 1,
        ...data,
      },
      select: { id: true },
    });
    productId = created.id;
  } else {
    // updateMany escopa por storeId (segurança multi-tenant)
    const updated = await prisma.product.updateMany({
      where: { id, storeId: session.storeId },
      data,
    });
    if (updated.count === 0) return;
    productId = id;
  }

  // Sincroniza vínculos de grupos de adicionais (com regras por grupo)
  await prisma.productComplementGroup.deleteMany({ where: { productId } });
  if (validGroupIds.length) {
    await prisma.productComplementGroup.createMany({
      data: validGroupIds.map((groupId, index) => {
        const min = nonNegInt(formData.get(`group_${groupId}_min`));
        const maxRaw = nonNegInt(formData.get(`group_${groupId}_max`));
        // garante min <= max quando há limite (max=0 = sem limite)
        const max = maxRaw > 0 && maxRaw < min ? min : maxRaw;
        return {
          productId,
          groupId,
          required: formData.get(`group_${groupId}_required`) != null,
          min,
          max,
          position: index,
        };
      }),
    });
  }

  revalidatePath("/painel/produtos");
  redirect("/painel/produtos");
}

export async function excluirProduto(id: string) {
  const session = await requireSession();
  if (!id) return;

  await prisma.product.deleteMany({
    where: { id, storeId: session.storeId },
  });

  revalidatePath("/painel/produtos");
  redirect("/painel/produtos");
}

export async function alternarDisponibilidadeProduto(id: string) {
  const session = await requireSession();
  const product = await prisma.product.findFirst({
    where: { id, storeId: session.storeId },
    select: { active: true },
  });
  if (!product) return;

  await prisma.product.updateMany({
    where: { id, storeId: session.storeId },
    data: { active: !product.active },
  });

  revalidatePath("/painel/produtos");
}

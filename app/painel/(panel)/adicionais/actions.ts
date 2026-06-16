"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { parseToCents } from "@/lib/money";

type ItemInput = {
  name: string;
  price: string;
  description: string;
};

/** Lê os campos repetidos do FormData (itemName[], itemPrice[], itemDescription[]). */
function readItems(formData: FormData): ItemInput[] {
  const names = formData.getAll("itemName").map((v) => String(v));
  const prices = formData.getAll("itemPrice").map((v) => String(v));
  const descriptions = formData.getAll("itemDescription").map((v) => String(v));

  const items: ItemInput[] = [];
  for (let i = 0; i < names.length; i++) {
    const name = (names[i] ?? "").trim();
    if (!name) continue; // ignora linhas sem nome
    items.push({
      name,
      price: (prices[i] ?? "").trim(),
      description: (descriptions[i] ?? "").trim(),
    });
  }
  return items;
}

export async function salvarGrupo(formData: FormData) {
  const session = await requireSession();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const description = String(formData.get("description") ?? "").trim();
  const active = formData.get("active") != null;

  const items = readItems(formData);

  const last = await prisma.complementGroup.findFirst({
    where: { storeId: session.storeId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const position = (last?.position ?? -1) + 1;

  await prisma.complementGroup.create({
    data: {
      storeId: session.storeId,
      title,
      description: description || null,
      active,
      position,
      items: {
        create: items.map((it, idx) => ({
          name: it.name,
          description: it.description || null,
          price: it.price ? parseToCents(it.price) : 0,
          position: idx,
        })),
      },
    },
  });

  revalidatePath("/painel/adicionais");
}

export async function editarGrupo(formData: FormData) {
  const session = await requireSession();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Garante que o grupo pertence à loja (multi-tenant).
  const grupo = await prisma.complementGroup.findFirst({
    where: { id, storeId: session.storeId },
    select: { id: true },
  });
  if (!grupo) return;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const description = String(formData.get("description") ?? "").trim();
  const active = formData.get("active") != null;

  const items = readItems(formData);

  // Substitui os itens (remove os antigos e recria) dentro de uma transação.
  await prisma.$transaction([
    prisma.complementItem.deleteMany({ where: { groupId: id } }),
    prisma.complementGroup.update({
      where: { id },
      data: {
        title,
        description: description || null,
        active,
        items: {
          create: items.map((it, idx) => ({
            name: it.name,
            description: it.description || null,
            price: it.price ? parseToCents(it.price) : 0,
            position: idx,
          })),
        },
      },
    }),
  ]);

  revalidatePath("/painel/adicionais");
}

export async function excluirGrupo(id: string) {
  const session = await requireSession();
  // deleteMany escopado por storeId garante o isolamento multi-tenant.
  await prisma.complementGroup.deleteMany({
    where: { id, storeId: session.storeId },
  });
  revalidatePath("/painel/adicionais");
}

export async function alternarDisponibilidadeGrupo(id: string) {
  const session = await requireSession();
  const grupo = await prisma.complementGroup.findFirst({
    where: { id, storeId: session.storeId },
    select: { active: true },
  });
  if (!grupo) return;
  await prisma.complementGroup.updateMany({
    where: { id, storeId: session.storeId },
    data: { active: !grupo.active },
  });
  revalidatePath("/painel/adicionais");
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

const MAX_TABLES = 200;

/**
 * Cria/remove mesas para igualar a quantidade informada.
 * - Garante RestaurantTable de 1..N (upsert por [storeId, number]).
 * - Remove as mesas acima de N que estejam FREE (mesas OCCUPIED são preservadas).
 */
export async function definirMesas(formData: FormData) {
  const session = await requireSession();
  const storeId = session.storeId;

  const raw = Number(formData.get("quantidade"));
  if (!Number.isFinite(raw)) return;

  const quantidade = Math.max(0, Math.min(MAX_TABLES, Math.trunc(raw)));

  // Garante mesas de 1..N.
  for (let number = 1; number <= quantidade; number++) {
    await prisma.restaurantTable.upsert({
      where: { storeId_number: { storeId, number } },
      update: {},
      create: { storeId, number },
    });
  }

  // Remove mesas acima de N que estejam livres (não mexe nas ocupadas).
  await prisma.restaurantTable.deleteMany({
    where: {
      storeId,
      number: { gt: quantidade },
      status: "FREE",
    },
  });

  revalidatePath("/painel/mesas");
}

/** Alterna o status de uma mesa entre FREE e OCCUPIED. */
export async function alternarStatusMesa(id: string) {
  const session = await requireSession();
  const storeId = session.storeId;

  const table = await prisma.restaurantTable.findFirst({
    where: { id, storeId },
    select: { id: true, status: true },
  });
  if (!table) return;

  await prisma.restaurantTable.update({
    where: { id: table.id },
    data: { status: table.status === "FREE" ? "OCCUPIED" : "FREE" },
  });

  revalidatePath("/painel/mesas");
}

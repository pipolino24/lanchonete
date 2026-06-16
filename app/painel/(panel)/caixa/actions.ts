"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { parseToCents } from "@/lib/money";

const PATH = "/painel/caixa";

/** Busca o caixa aberto mais recente da loja. */
async function getOpenRegister(storeId: string) {
  return prisma.cashRegister.findFirst({
    where: { storeId, status: "OPEN" },
    orderBy: { openedAt: "desc" },
  });
}

export async function abrirCaixa(formData: FormData) {
  const session = await requireSession();

  // Evita abrir dois caixas simultaneamente.
  const existing = await getOpenRegister(session.storeId);
  if (existing) {
    revalidatePath(PATH);
    return;
  }

  const openingBalance = parseToCents(String(formData.get("openingBalance") ?? ""));
  const note = String(formData.get("note") ?? "").trim();

  await prisma.cashRegister.create({
    data: {
      storeId: session.storeId,
      status: "OPEN",
      openingBalance,
      note: note || null,
      openedBy: session.name,
    },
  });

  revalidatePath(PATH);
}

export async function registrarEntrada(formData: FormData) {
  const session = await requireSession();
  const register = await getOpenRegister(session.storeId);
  if (!register) return;

  const amount = parseToCents(String(formData.get("amount") ?? ""));
  if (amount <= 0) {
    revalidatePath(PATH);
    return;
  }
  const description = String(formData.get("description") ?? "").trim();

  await prisma.cashMovement.create({
    data: {
      registerId: register.id,
      type: "IN",
      amount,
      description: description || null,
    },
  });

  revalidatePath(PATH);
}

export async function registrarSaida(formData: FormData) {
  const session = await requireSession();
  const register = await getOpenRegister(session.storeId);
  if (!register) return;

  const amount = parseToCents(String(formData.get("amount") ?? ""));
  if (amount <= 0) {
    revalidatePath(PATH);
    return;
  }
  const description = String(formData.get("description") ?? "").trim();

  await prisma.cashMovement.create({
    data: {
      registerId: register.id,
      type: "OUT",
      amount,
      description: description || null,
    },
  });

  revalidatePath(PATH);
}

export async function fecharCaixa(formData: FormData) {
  const session = await requireSession();
  const register = await getOpenRegister(session.storeId);
  if (!register) return;

  const countedBalance = parseToCents(String(formData.get("countedBalance") ?? ""));
  const note = String(formData.get("note") ?? "").trim();

  await prisma.cashRegister.update({
    where: { id: register.id },
    data: {
      status: "CLOSED",
      countedBalance,
      note: note || register.note,
      closedAt: new Date(),
    },
  });

  revalidatePath(PATH);
}

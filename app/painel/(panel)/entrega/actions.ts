"use server";

import { revalidatePath } from "next/cache";
import type { DeliveryMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { parseToCents } from "@/lib/money";

const MODES: DeliveryMode[] = ["KM", "NEIGHBORHOOD", "FIXED"];

export async function salvarConfigEntrega(formData: FormData) {
  const session = await requireSession();

  const rawMode = String(formData.get("deliveryMode") ?? "");
  const deliveryMode: DeliveryMode = MODES.includes(rawMode as DeliveryMode)
    ? (rawMode as DeliveryMode)
    : "KM";

  const prepTimeRaw = parseInt(String(formData.get("prepTime") ?? ""), 10);
  const prepTime = Number.isNaN(prepTimeRaw) || prepTimeRaw < 0 ? 40 : prepTimeRaw;

  const freeRaw = String(formData.get("freeShippingAbove") ?? "").trim();
  const freeShippingAbove = freeRaw === "" ? null : parseToCents(freeRaw);

  await prisma.store.update({
    where: { id: session.storeId },
    data: { deliveryMode, prepTime, freeShippingAbove },
  });

  revalidatePath("/painel/entrega");
}

export async function criarFaixa(formData: FormData) {
  const session = await requireSession();

  const store = await prisma.store.findUnique({
    where: { id: session.storeId },
    select: { deliveryMode: true },
  });
  const deliveryMode = store?.deliveryMode ?? "KM";

  const labelRaw = String(formData.get("label") ?? "").trim();
  // Bairro é obrigatório no modo NEIGHBORHOOD; ignorado no modo FIXED.
  const label = deliveryMode === "FIXED" ? null : labelRaw === "" ? null : labelRaw;

  if (deliveryMode === "NEIGHBORHOOD" && label === null) return;

  // maxKm só faz sentido no modo KM.
  let maxKm: number | null = null;
  if (deliveryMode === "KM") {
    const kmRaw = String(formData.get("maxKm") ?? "").trim().replace(",", ".");
    const kmNum = parseFloat(kmRaw);
    maxKm = kmRaw === "" || Number.isNaN(kmNum) ? null : kmNum;
  }

  const fee = parseToCents(String(formData.get("fee") ?? ""));

  const etaRaw = parseInt(String(formData.get("etaMinutes") ?? ""), 10);
  const etaMinutes = Number.isNaN(etaRaw) || etaRaw < 0 ? 30 : etaRaw;

  // No modo FIXED existe apenas uma taxa fixa: não cria uma segunda.
  if (deliveryMode === "FIXED") {
    const existing = await prisma.deliveryZone.count({
      where: { storeId: session.storeId },
    });
    if (existing > 0) return;
  }

  const last = await prisma.deliveryZone.findFirst({
    where: { storeId: session.storeId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.deliveryZone.create({
    data: {
      storeId: session.storeId,
      label,
      maxKm,
      fee,
      etaMinutes,
      position: (last?.position ?? -1) + 1,
    },
  });

  revalidatePath("/painel/entrega");
}

export async function excluirFaixa(id: string) {
  const session = await requireSession();
  await prisma.deliveryZone.deleteMany({
    where: { id, storeId: session.storeId },
  });
  revalidatePath("/painel/entrega");
}

export async function alternarFaixa(id: string) {
  const session = await requireSession();
  const zone = await prisma.deliveryZone.findFirst({
    where: { id, storeId: session.storeId },
    select: { active: true },
  });
  if (!zone) return;
  await prisma.deliveryZone.updateMany({
    where: { id, storeId: session.storeId },
    data: { active: !zone.active },
  });
  revalidatePath("/painel/entrega");
}

export async function criarEntregador(formData: FormData) {
  const session = await requireSession();

  const name = String(formData.get("name") ?? "").trim();
  if (name === "") return;

  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const phone = phoneRaw === "" ? null : phoneRaw;

  await prisma.driver.create({
    data: { storeId: session.storeId, name, phone },
  });

  revalidatePath("/painel/entrega");
}

export async function excluirEntregador(id: string) {
  const session = await requireSession();
  await prisma.driver.deleteMany({
    where: { id, storeId: session.storeId },
  });
  revalidatePath("/painel/entrega");
}

export async function alternarEntregador(id: string) {
  const session = await requireSession();
  const driver = await prisma.driver.findFirst({
    where: { id, storeId: session.storeId },
    select: { active: true },
  });
  if (!driver) return;
  await prisma.driver.updateMany({
    where: { id, storeId: session.storeId },
    data: { active: !driver.active },
  });
  revalidatePath("/painel/entrega");
}

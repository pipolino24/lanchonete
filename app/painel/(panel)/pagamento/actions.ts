"use server";

import { revalidatePath } from "next/cache";
import type { PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function alternarPagamento(
  method: PaymentMethod,
  campo: "delivery" | "pickup",
) {
  const session = await requireSession();

  const config = await prisma.paymentConfig.findUnique({
    where: { storeId_method: { storeId: session.storeId, method } },
  });
  if (!config) return;

  const data =
    campo === "delivery"
      ? { enabledDelivery: !config.enabledDelivery }
      : { enabledPickup: !config.enabledPickup };

  await prisma.paymentConfig.update({
    where: { storeId_method: { storeId: session.storeId, method } },
    data,
  });

  revalidatePath("/painel/pagamento");
}

export async function salvarTaxa(method: PaymentMethod, percent: number) {
  const session = await requireSession();

  const safe = Number.isFinite(percent) && percent >= 0 ? percent : 0;

  await prisma.paymentConfig.update({
    where: { storeId_method: { storeId: session.storeId, method } },
    data: { extraFeePercent: safe },
  });

  revalidatePath("/painel/pagamento");
}

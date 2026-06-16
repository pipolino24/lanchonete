"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

const NEXT: Record<string, OrderStatus | null> = {
  NEW: "PREPARING",
  PREPARING: "DELIVERING",
  DELIVERING: "COMPLETED",
  COMPLETED: null,
  CANCELED: null,
};

export async function advanceOrder(orderId: string) {
  const session = await requireSession();
  const order = await prisma.order.findFirst({ where: { id: orderId, storeId: session.storeId } });
  if (!order) return;
  const next = NEXT[order.status];
  if (next) {
    await prisma.order.update({ where: { id: orderId }, data: { status: next } });
  }
  revalidatePath("/painel/pedidos");
}

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  const session = await requireSession();
  await prisma.order.updateMany({
    where: { id: orderId, storeId: session.storeId },
    data: { status },
  });
  revalidatePath("/painel/pedidos");
}

export async function cancelOrder(orderId: string) {
  const session = await requireSession();
  await prisma.order.updateMany({
    where: { id: orderId, storeId: session.storeId },
    data: { status: "CANCELED" },
  });
  revalidatePath("/painel/pedidos");
}

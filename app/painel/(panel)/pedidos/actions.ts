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

/** Libera a mesa se o pedido não tem mais pedidos ativos. */
async function liberarMesaSeVazia(storeId: string, tableId: string | null) {
  if (!tableId) return;
  const ativos = await prisma.order.count({
    where: { storeId, tableId, status: { notIn: ["COMPLETED", "CANCELED"] } },
  });
  if (ativos === 0) {
    await prisma.restaurantTable.updateMany({ where: { id: tableId, storeId }, data: { status: "FREE" } });
  }
}

export async function advanceOrder(orderId: string) {
  const session = await requireSession();
  const order = await prisma.order.findFirst({ where: { id: orderId, storeId: session.storeId } });
  if (!order) return;
  // Retirada/mesa não passam por "A caminho"
  const next =
    order.status === "PREPARING" && order.type !== "DELIVERY" ? "COMPLETED" : NEXT[order.status];
  if (next) {
    await prisma.order.update({ where: { id: orderId }, data: { status: next } });
    if (next === "COMPLETED") await liberarMesaSeVazia(session.storeId, order.tableId);
  }
  revalidatePath("/painel/pedidos");
}

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  const session = await requireSession();
  // Não ressuscita pedido finalizado/cancelado
  await prisma.order.updateMany({
    where: { id: orderId, storeId: session.storeId, status: { notIn: ["COMPLETED", "CANCELED"] } },
    data: { status },
  });
  revalidatePath("/painel/pedidos");
}

export async function cancelOrder(orderId: string) {
  const session = await requireSession();
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId: session.storeId },
    select: { tableId: true, status: true },
  });
  if (!order || order.status === "COMPLETED" || order.status === "CANCELED") return;
  await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELED" } });
  await liberarMesaSeVazia(session.storeId, order.tableId);
  revalidatePath("/painel/pedidos");
}

export async function atribuirEntregador(orderId: string, driverId: string) {
  const session = await requireSession();
  // Valida que o entregador é da própria loja (evita vincular driver de outra loja)
  if (driverId) {
    const drv = await prisma.driver.findFirst({
      where: { id: driverId, storeId: session.storeId },
      select: { id: true },
    });
    if (!drv) return;
  }
  await prisma.order.updateMany({
    where: { id: orderId, storeId: session.storeId },
    data: { driverId: driverId || null },
  });
  revalidatePath("/painel/pedidos");
}

export async function salvarAnotacaoCliente(orderId: string, texto: string) {
  const session = await requireSession();
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId: session.storeId },
    select: { customerId: true },
  });
  if (!order?.customerId) return;
  await prisma.customer.updateMany({
    where: { id: order.customerId, storeId: session.storeId },
    data: { notes: texto },
  });
  revalidatePath("/painel/pedidos");
}

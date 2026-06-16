"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { OrderType, PaymentMethod } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { parseToCents } from "@/lib/money";
import { createOrder } from "@/lib/orders";

type PdvPayload = {
  type?: string;
  customer?: { name?: string; phone?: string };
  comanda?: string;
  attendant?: string;
  table?: string;
  paymentMethod?: string;
  items?: { productId: string; quantity: number }[];
  discount?: string;
  surcharge?: string;
};

const ORDER_TYPES: OrderType[] = ["DELIVERY", "PICKUP", "DINEIN"];
const PAYMENT_METHODS: PaymentMethod[] = [
  "PIX",
  "CASH",
  "CREDIT",
  "DEBIT",
  "MEAL_VOUCHER",
  "FOOD_VOUCHER",
];

export async function criarPedidoPdv(formData: FormData) {
  const session = await requireSession();

  let payload: PdvPayload;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? "{}")) as PdvPayload;
  } catch {
    return;
  }

  const type = ORDER_TYPES.includes(payload.type as OrderType)
    ? (payload.type as OrderType)
    : "DINEIN";

  const items = (payload.items ?? [])
    .map((i) => ({
      productId: String(i.productId),
      quantity: Math.max(1, Math.floor(Number(i.quantity) || 0)),
    }))
    .filter((i) => i.productId && i.quantity > 0);

  if (items.length === 0) return;

  const name = payload.customer?.name?.trim();
  const phone = payload.customer?.phone?.trim();
  const customer = name || phone ? { name, phone } : undefined;

  const comanda = payload.comanda?.trim() || null;
  const attendant = payload.attendant?.trim() || null;

  const tableRaw = payload.table?.trim();
  const tableNumber =
    type === "DINEIN" && tableRaw ? parseInt(tableRaw, 10) : null;

  const paymentMethod = PAYMENT_METHODS.includes(
    payload.paymentMethod as PaymentMethod,
  )
    ? (payload.paymentMethod as PaymentMethod)
    : null;

  const discount = payload.discount ? parseToCents(payload.discount) : 0;
  const surcharge = payload.surcharge ? parseToCents(payload.surcharge) : 0;

  await createOrder({
    storeId: session.storeId,
    channel: "PDV",
    type,
    customer,
    comanda,
    attendant,
    tableNumber: Number.isNaN(tableNumber as number) ? null : tableNumber,
    items,
    paymentMethod,
    discount,
    surcharge,
  });

  revalidatePath("/painel/pedidos");
  redirect("/painel/pedidos");
}

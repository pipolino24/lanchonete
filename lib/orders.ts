import { prisma } from "@/lib/prisma";
import { quoteDelivery } from "@/lib/delivery";
import type { OrderType, PaymentMethod, OrderChannel } from "@prisma/client";

export type OrderItemInput = {
  productId: string;
  quantity: number;
  note?: string;
  removedIngredients?: string[];
  complements?: { itemId: string; quantity: number }[];
};

export type CreateOrderInput = {
  storeId: string;
  channel?: OrderChannel;
  type: OrderType;
  customer?: { name?: string; phone?: string };
  address?: {
    zipCode?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    complement?: string;
  } | null;
  tableNumber?: number | null;
  comanda?: string | null;
  attendant?: string | null;
  items: OrderItemInput[];
  paymentMethod?: PaymentMethod | null;
  changeFor?: number | null;
  couponCode?: string | null;
  discount?: number;
  surcharge?: number;
  tip?: number;
  note?: string | null;
  scheduledFor?: string | null;
};

/** Gera um código de pedido tipo "012-483920". */
async function generateOrderCode(storeId: string): Promise<string> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const todayCount = await prisma.order.count({
    where: { storeId, createdAt: { gte: start } },
  });
  const seq = String(todayCount + 1).padStart(3, "0");
  const suffix = Math.floor(100000 + ((Date.now() % 900000) | 0));
  return `${seq}-${suffix}`;
}

export async function createOrder(input: CreateOrderInput) {
  const store = await prisma.store.findUniqueOrThrow({ where: { id: input.storeId } });

  // Revalida preços a partir do banco
  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const complementIds = [
    ...new Set(input.items.flatMap((i) => (i.complements ?? []).map((c) => c.itemId))),
  ];
  const complements = complementIds.length
    ? await prisma.complementItem.findMany({ where: { id: { in: complementIds } } })
    : [];
  const complementMap = new Map(complements.map((c) => [c.id, c]));

  let subtotal = 0;
  const itemsData = input.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Produto inválido: ${item.productId}`);
    const base = product.promoPrice ?? product.price;

    const comps = (item.complements ?? [])
      .map((c) => {
        const ci = complementMap.get(c.itemId);
        if (!ci) return null;
        return { item: ci, quantity: c.quantity };
      })
      .filter((x): x is { item: (typeof complements)[number]; quantity: number } => x !== null);

    const compsTotal = comps.reduce((s, c) => s + c.item.price * c.quantity, 0);
    const unitPrice = base;
    const lineTotal = (base + compsTotal) * item.quantity;
    subtotal += lineTotal;

    const noteParts: string[] = [];
    if (item.removedIngredients?.length) noteParts.push(`Sem: ${item.removedIngredients.join(", ")}`);
    if (item.note) noteParts.push(item.note);

    return {
      productId: product.id,
      name: product.name,
      unitPrice,
      quantity: item.quantity,
      totalPrice: lineTotal,
      note: noteParts.join(" | ") || null,
      complements: {
        create: comps.map((c) => ({
          complementItemId: c.item.id,
          name: c.item.name,
          price: c.item.price,
          quantity: c.quantity,
        })),
      },
    };
  });

  // Cupom (resolvido antes do frete, pois pode zerar a entrega)
  let discount = input.discount ?? 0;
  let couponId: string | null = null;
  let couponFreeShipping = false;
  if (input.couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: { storeId: store.id, code: input.couponCode.toUpperCase(), active: true },
    });
    if (coupon && (!coupon.minOrder || subtotal >= coupon.minOrder)) {
      couponId = coupon.id;
      if (coupon.discountType === "PERCENT") discount += Math.round((subtotal * coupon.discountValue) / 100);
      else discount += coupon.discountValue;
      if (coupon.freeShipping) couponFreeShipping = true;
      await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
    }
  }

  // Frete — calculado de verdade pela config da loja + endereço (fonte da verdade)
  let deliveryFee = 0;
  if (input.type === "DELIVERY") {
    const quote = await quoteDelivery(store, input.address, subtotal, { couponFreeShipping });
    if (!quote.served) throw new Error(quote.reason ?? "Endereço fora da área de entrega.");
    deliveryFee = quote.fee;
  }

  // Taxa de pagamento (cartão presencial, etc.)
  let paymentFee = 0;
  if (input.paymentMethod) {
    const pc = await prisma.paymentConfig.findFirst({
      where: { storeId: store.id, method: input.paymentMethod },
    });
    if (pc?.extraFeePercent) paymentFee = Math.round((subtotal * pc.extraFeePercent) / 100);
  }

  const surcharge = input.surcharge ?? 0;
  const tip = input.tip ?? 0;
  const total = Math.max(0, subtotal + deliveryFee + paymentFee + surcharge + tip - discount);

  // Cliente (upsert por telefone)
  let customerId: string | null = null;
  let addressId: string | null = null;
  if (input.customer?.phone) {
    const customer = await prisma.customer.upsert({
      where: { storeId_phone: { storeId: store.id, phone: input.customer.phone } },
      update: { name: input.customer.name || undefined },
      create: {
        storeId: store.id,
        name: input.customer.name || "Cliente",
        phone: input.customer.phone,
      },
    });
    customerId = customer.id;

    if (input.type === "DELIVERY" && input.address?.street) {
      const addr = await prisma.address.create({
        data: {
          customerId: customer.id,
          street: input.address.street,
          number: input.address.number,
          neighborhood: input.address.neighborhood,
          city: input.address.city,
          state: input.address.state,
          zipCode: input.address.zipCode,
          complement: input.address.complement,
        },
      });
      addressId = addr.id;
    }
  }

  const addressSnapshot =
    input.type === "DELIVERY" && input.address?.street
      ? [
          `${input.address.street}, ${input.address.number ?? "s/n"}`,
          input.address.neighborhood,
          input.address.city,
          input.address.state,
          input.address.zipCode ? `CEP ${input.address.zipCode}` : null,
          input.address.complement,
        ]
          .filter(Boolean)
          .join(", ")
      : null;

  const code = await generateOrderCode(store.id);

  const order = await prisma.order.create({
    data: {
      storeId: store.id,
      code,
      type: input.type,
      channel: input.channel ?? "ONLINE",
      status: "NEW",
      customerId,
      customerName: input.customer?.name,
      customerPhone: input.customer?.phone,
      addressId,
      addressSnapshot,
      comanda: input.comanda,
      attendant: input.attendant,
      paymentMethod: input.paymentMethod ?? null,
      changeFor: input.changeFor ?? null,
      subtotal,
      deliveryFee,
      paymentFee,
      discount,
      surcharge,
      tip,
      total,
      couponId,
      note: input.note,
      scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
      items: { create: itemsData },
    },
    include: { items: { include: { complements: true } } },
  });

  return order;
}

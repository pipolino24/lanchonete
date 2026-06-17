import { prisma } from "@/lib/prisma";
import { quoteDelivery } from "@/lib/delivery";
import { formatPrice } from "@/lib/money";
import type { OrderType, PaymentMethod, OrderChannel } from "@prisma/client";

/** Erro de regra de negócio cuja mensagem pode ser exibida ao cliente. */
export class OrderError extends Error {}

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

  // Revalida tudo a partir do banco, em paralelo: produtos (escopo loja + ativos),
  // complementos (escopo loja via grupo) e os vínculos produto↔grupo (min/max/obrigatório).
  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const complementIds = [
    ...new Set(input.items.flatMap((i) => (i.complements ?? []).map((c) => c.itemId))),
  ];
  const [products, complements, links] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds }, storeId: store.id, active: true } }),
    complementIds.length
      ? prisma.complementItem.findMany({
          where: { id: { in: complementIds }, active: true, group: { storeId: store.id } },
        })
      : Promise.resolve([]),
    prisma.productComplementGroup.findMany({ where: { productId: { in: productIds } } }),
  ]);
  const productMap = new Map(products.map((p) => [p.id, p]));
  const complementMap = new Map(complements.map((c) => [c.id, c]));

  // grupos permitidos por produto (com required/min/max)
  const allowedByProduct = new Map<string, { groupId: string; required: boolean; min: number; max: number }[]>();
  for (const l of links) {
    const arr = allowedByProduct.get(l.productId) ?? [];
    arr.push({ groupId: l.groupId, required: l.required, min: l.min, max: l.max });
    allowedByProduct.set(l.productId, arr);
  }

  let subtotal = 0;
  const itemsData = input.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new OrderError("Um dos itens não está mais disponível. Atualize o cardápio.");
    const base = product.promoPrice ?? product.price;

    const comps = (item.complements ?? [])
      .map((c) => {
        const ci = complementMap.get(c.itemId);
        if (!ci) return null;
        return { item: ci, quantity: c.quantity };
      })
      .filter((x): x is { item: (typeof complements)[number]; quantity: number } => x !== null);

    // Valida complementos: pertencem a um grupo do produto + respeitam obrigatório/min/max
    const allowed = allowedByProduct.get(product.id) ?? [];
    const allowedGroups = new Set(allowed.map((g) => g.groupId));
    for (const c of comps) {
      if (!allowedGroups.has(c.item.groupId))
        throw new OrderError(`Complemento inválido para ${product.name}.`);
    }
    for (const g of allowed) {
      const qty = comps.filter((c) => c.item.groupId === g.groupId).reduce((s, c) => s + c.quantity, 0);
      if (g.required && qty === 0)
        throw new OrderError(`Escolha as opções obrigatórias de ${product.name}.`);
      if (g.min > 0 && qty < g.min)
        throw new OrderError(`Selecione ao menos ${g.min} opção(ões) em ${product.name}.`);
      if (g.max > 0 && qty > g.max)
        throw new OrderError(`Máximo de ${g.max} opção(ões) por grupo em ${product.name}.`);
    }

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

  // Pedido mínimo e loja ativa (somente canais públicos; PDV pode burlar)
  if (input.channel !== "PDV") {
    if (!store.active) throw new OrderError("Loja indisponível no momento.");
    if (store.minOrder && subtotal < store.minOrder)
      throw new OrderError(`Pedido mínimo de ${formatPrice(store.minOrder)}.`);
  }

  // Cupom (resolvido antes do frete, pois pode zerar a entrega)
  let discount = input.discount ?? 0;
  let couponId: string | null = null;
  let couponFreeShipping = false;
  if (input.couponCode) {
    const now = new Date();
    const coupon = await prisma.coupon.findFirst({
      where: {
        storeId: store.id,
        code: input.couponCode.toUpperCase(),
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
    });
    if (coupon && (!coupon.minOrder || subtotal >= coupon.minOrder)) {
      // Limite por cliente (conta pedidos anteriores com este cupom + telefone)
      let perCustomerOk = true;
      if (coupon.perCustomerLimit != null && input.customer?.phone) {
        const used = await prisma.order.count({
          where: { storeId: store.id, couponId: coupon.id, customerPhone: input.customer.phone },
        });
        perCustomerOk = used < coupon.perCustomerLimit;
      }
      // Limite total: incremento atômico respeitando o teto (fecha a corrida)
      const inc = await prisma.coupon.updateMany({
        where: {
          id: coupon.id,
          ...(coupon.totalLimit != null ? { usedCount: { lt: coupon.totalLimit } } : {}),
        },
        data: { usedCount: { increment: 1 } },
      });
      if (perCustomerOk && inc.count === 1) {
        couponId = coupon.id;
        if (coupon.discountType === "PERCENT") discount += Math.round((subtotal * coupon.discountValue) / 100);
        else discount += coupon.discountValue;
        if (coupon.freeShipping) couponFreeShipping = true;
      } else if (inc.count === 1) {
        // passou do limite por cliente: desfaz o incremento total
        await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { decrement: 1 } } });
      }
    }
  }

  // Frete — calculado de verdade pela config da loja + endereço (fonte da verdade)
  let deliveryFee = 0;
  if (input.type === "DELIVERY") {
    const quote = await quoteDelivery(store, input.address, subtotal, { couponFreeShipping });
    if (!quote.served) throw new OrderError(quote.reason ?? "Endereço fora da área de entrega.");
    deliveryFee = quote.fee;
  }

  // Taxa de pagamento (cartão presencial, etc.) + valida forma ativa para o tipo
  let paymentFee = 0;
  if (input.paymentMethod) {
    const pc = await prisma.paymentConfig.findFirst({
      where: { storeId: store.id, method: input.paymentMethod },
    });
    if (input.channel !== "PDV" && pc) {
      const enabled = input.type === "DELIVERY" ? pc.enabledDelivery : pc.enabledPickup;
      if (!enabled) throw new OrderError("Forma de pagamento indisponível para este tipo de pedido.");
    }
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

  // Cria o pedido com retry: se dois pedidos colidirem no código (corrida), regenera
  for (let attempt = 0; ; attempt++) {
    const code = await generateOrderCode(store.id);
    try {
      return await prisma.order.create({
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
    } catch (e) {
      const dup = !!e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002";
      if (dup && attempt < 4) continue;
      throw e;
    }
  }
}

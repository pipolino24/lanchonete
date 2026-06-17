import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOrder, OrderError } from "@/lib/orders";

const schema = z.object({
  type: z.enum(["DELIVERY", "PICKUP", "DINEIN"]),
  customer: z.object({ name: z.string().optional(), phone: z.string().optional() }).optional(),
  address: z
    .object({
      zipCode: z.string().optional(),
      street: z.string().optional(),
      number: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      complement: z.string().optional(),
    })
    .nullable()
    .optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1),
        note: z.string().optional(),
        removedIngredients: z.array(z.string()).optional(),
        complements: z
          .array(z.object({ itemId: z.string(), quantity: z.number().int().min(1) }))
          .optional(),
      }),
    )
    .min(1),
  paymentMethod: z.enum(["PIX", "CASH", "CREDIT", "DEBIT", "MEAL_VOUCHER", "FOOD_VOUCHER"]).nullable().optional(),
  changeFor: z.number().int().nullable().optional(),
  couponCode: z.string().nullable().optional(),
  scheduledFor: z.string().nullable().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const order = await createOrder({ storeId: store.id, channel: "ONLINE", ...parsed.data });
    return NextResponse.json({ id: order.id, code: order.code, total: order.total }, { status: 201 });
  } catch (e) {
    console.error(e);
    const msg = e instanceof OrderError ? e.message : "Não foi possível criar o pedido. Tente novamente.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

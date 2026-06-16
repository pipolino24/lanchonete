import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { quoteDelivery } from "@/lib/delivery";

const schema = z.object({
  subtotal: z.number().int().min(0),
  couponCode: z.string().nullable().optional(),
  address: z
    .object({
      zipCode: z.string().optional(),
      street: z.string().optional(),
      number: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  // valida cupom de frete grátis (apenas a flag, sem aplicar desconto aqui)
  let couponFreeShipping = false;
  if (parsed.data.couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: { storeId: store.id, code: parsed.data.couponCode.toUpperCase(), active: true },
    });
    if (coupon?.freeShipping && (!coupon.minOrder || parsed.data.subtotal >= coupon.minOrder)) {
      couponFreeShipping = true;
    }
  }

  try {
    const quote = await quoteDelivery(store, parsed.data.address ?? null, parsed.data.subtotal, {
      couponFreeShipping,
    });
    return NextResponse.json(quote);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao calcular entrega" }, { status: 500 });
  }
}

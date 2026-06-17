import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getVerifiedPhone } from "@/lib/otp";

const schema = z.object({
  phone: z.string().min(8),
  name: z.string().min(2),
  cpf: z.string().min(11),
  birthDate: z.string().min(8),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({ where: { slug }, select: { id: true } });
  if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { phone, name, cpf, birthDate } = parsed.data;

  // Só permite cadastrar o telefone que foi verificado por OTP nesta sessão
  const verified = await getVerifiedPhone(store.id);
  if (verified !== phone) {
    return NextResponse.json({ error: "Telefone não verificado. Refaça a confirmação." }, { status: 401 });
  }

  await prisma.customer.upsert({
    where: { storeId_phone: { storeId: store.id, phone } },
    update: { name, cpf, birthDate, verifiedAt: new Date() },
    create: { storeId: store.id, name, phone, cpf, birthDate, verifiedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

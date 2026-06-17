import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkOtp, otpConfigured, setVerifiedCookie } from "@/lib/otp";

const schema = z.object({ phone: z.string().min(8), code: z.string().min(4).max(8) });

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({ where: { slug }, select: { id: true } });
  if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
  if (!otpConfigured()) return NextResponse.json({ error: "OTP não configurado" }, { status: 503 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { phone, code } = parsed.data;
  const r = await checkOtp(phone, code);
  if (!r.valid) {
    return NextResponse.json({ error: "Código inválido ou expirado." }, { status: 400 });
  }

  // Verificado → marca o cookie e identifica o cliente
  await setVerifiedCookie(store.id, phone);

  const customer = await prisma.customer.findUnique({
    where: { storeId_phone: { storeId: store.id, phone } },
    include: { addresses: { orderBy: { id: "desc" }, take: 5 } },
  });

  // "Registrado" = já tem cadastro completo (CPF preenchido)
  if (!customer || !customer.cpf) {
    return NextResponse.json({ ok: true, registered: false, customer: customer ? { name: customer.name } : null });
  }

  return NextResponse.json({
    ok: true,
    registered: true,
    customer: { name: customer.name },
    addresses: customer.addresses.map((a) => ({
      id: a.id,
      zipCode: a.zipCode,
      street: a.street,
      number: a.number,
      neighborhood: a.neighborhood,
      city: a.city,
      state: a.state,
      complement: a.complement,
    })),
  });
}

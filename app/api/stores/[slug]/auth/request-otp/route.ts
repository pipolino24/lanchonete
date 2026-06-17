import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendOtp, otpConfigured } from "@/lib/otp";

const schema = z.object({ phone: z.string().min(8) });

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({ where: { slug }, select: { id: true } });
  if (!store) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });

  // Sem chave configurada → o front cai no modo demonstração
  if (!otpConfigured()) return NextResponse.json({ error: "OTP não configurado" }, { status: 503 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });

  const r = await sendOtp(parsed.data.phone);
  if (!r.ok) {
    const map: Record<string, string> = {
      "rate-limit": "Aguarde um momento para reenviar o código.",
      cooldown: "Aguarde alguns segundos para reenviar.",
      unreachable: "Serviço de WhatsApp indisponível. Tente novamente.",
    };
    return NextResponse.json({ error: map[r.error ?? ""] || "Não foi possível enviar o código." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

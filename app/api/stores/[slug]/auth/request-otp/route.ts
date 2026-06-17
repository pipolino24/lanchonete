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
    const raw = (r.error ?? "").toLowerCase();
    let msg: string;
    if (raw === "unreachable") msg = "Serviço de WhatsApp indisponível. Tente em instantes.";
    else if (raw === "not-configured") msg = "OTP não configurado.";
    else if (raw.includes("aguard") || raw.includes("segundo") || raw.includes("rate") || raw.includes("limit") || raw.includes("spam") || raw.includes("muitas"))
      msg = "Você pediu o código há pouco. Aguarde até 1 minuto e tente de novo.";
    else if (raw.includes("invalid") || raw.includes("inval")) msg = "Número de WhatsApp inválido. Confira o DDD e o número.";
    else msg = r.error ? `Não foi possível enviar: ${r.error}` : "Não foi possível enviar o código.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

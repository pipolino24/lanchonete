"use server";

import { revalidatePath } from "next/cache";
import type { DiscountType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { parseToCents } from "@/lib/money";

function parseOptionalInt(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = parseInt(raw, 10);
  // negativo = inválido → sem limite (evita cupom "morto")
  return Number.isNaN(n) || n < 0 ? null : n;
}

function parseOptionalDate(value: FormDataEntryValue | null): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function salvarCupom(formData: FormData) {
  const session = await requireSession();

  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  if (!code) return;

  const discountType = (String(formData.get("discountType") ?? "PERCENT") ===
  "FIXED"
    ? "FIXED"
    : "PERCENT") as DiscountType;

  const rawValue = String(formData.get("discountValue") ?? "").trim();
  let discountValue: number;
  if (discountType === "PERCENT") {
    const pct = parseInt(rawValue, 10);
    discountValue = Number.isNaN(pct) ? 0 : Math.min(100, Math.max(0, pct));
  } else {
    discountValue = parseToCents(rawValue);
  }

  const minOrderRaw = String(formData.get("minOrder") ?? "").trim();
  const minOrder = minOrderRaw ? parseToCents(minOrderRaw) : null;

  const freeShipping = formData.get("freeShipping") != null;
  const perCustomerLimit = parseOptionalInt(formData.get("perCustomerLimit"));
  const totalLimit = parseOptionalInt(formData.get("totalLimit"));
  const startsAt = parseOptionalDate(formData.get("startsAt"));
  const endsAt = parseOptionalDate(formData.get("endsAt"));

  // Janela inválida (fim antes do início) → não cria
  if (startsAt && endsAt && endsAt < startsAt) return;

  try {
    await prisma.coupon.create({
      data: {
        storeId: session.storeId,
        code,
        discountType,
        discountValue,
        minOrder,
        freeShipping,
        perCustomerLimit,
        totalLimit,
        startsAt,
        endsAt,
      },
    });
  } catch (e) {
    // código duplicado (P2002) — não derruba a página
    if (!(e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002")) throw e;
    return;
  }

  revalidatePath("/painel/cupons");
}

export async function excluirCupom(id: string) {
  const session = await requireSession();
  await prisma.coupon.deleteMany({
    where: { id, storeId: session.storeId },
  });
  revalidatePath("/painel/cupons");
}

export async function alternarCupom(id: string) {
  const session = await requireSession();
  const cupom = await prisma.coupon.findFirst({
    where: { id, storeId: session.storeId },
    select: { active: true },
  });
  if (!cupom) return;
  await prisma.coupon.update({
    where: { id },
    data: { active: !cupom.active },
  });
  revalidatePath("/painel/cupons");
}

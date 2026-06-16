"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { parseToCents } from "@/lib/money";

const PIX_KEY_TYPES = ["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"] as const;
type PixKeyType = (typeof PIX_KEY_TYPES)[number];

/** Normaliza um campo de texto opcional: vazio -> null. */
function optional(formData: FormData, key: string): string | null {
  const raw = String(formData.get(key) ?? "").trim();
  return raw === "" ? null : raw;
}

export async function salvarLoja(formData: FormData) {
  const session = await requireSession();

  const name = String(formData.get("name") ?? "").trim();

  const minOrder = parseToCents(String(formData.get("minOrder") ?? ""));

  const primaryColorRaw = String(formData.get("primaryColor") ?? "").trim();
  const primaryColor = /^#[0-9a-fA-F]{6}$/.test(primaryColorRaw)
    ? primaryColorRaw.toUpperCase()
    : "#F2611F";

  const pixKeyTypeRaw = String(formData.get("pixKeyType") ?? "").trim();
  const pixKeyType: PixKeyType | null = PIX_KEY_TYPES.includes(
    pixKeyTypeRaw as PixKeyType,
  )
    ? (pixKeyTypeRaw as PixKeyType)
    : null;

  await prisma.store.update({
    where: { id: session.storeId },
    data: {
      ...(name !== "" ? { name } : {}),
      document: optional(formData, "document"),
      whatsapp: optional(formData, "whatsapp"),
      minOrder: minOrder < 0 ? 0 : minOrder,
      primaryColor,
      logoUrl: optional(formData, "logoUrl"),
      coverUrl: optional(formData, "coverUrl"),
      street: optional(formData, "street"),
      number: optional(formData, "number"),
      neighborhood: optional(formData, "neighborhood"),
      city: optional(formData, "city"),
      state: optional(formData, "state"),
      zipCode: optional(formData, "zipCode"),
      pixKey: optional(formData, "pixKey"),
      pixKeyType,
      cartMessage: optional(formData, "cartMessage"),
    },
  });

  revalidatePath("/painel/loja");
}

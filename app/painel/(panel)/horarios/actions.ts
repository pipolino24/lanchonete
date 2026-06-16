"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

function normalizeTime(value: FormDataEntryValue | null, fallback: string): string {
  const raw = typeof value === "string" ? value.trim() : "";
  return HHMM.test(raw) ? raw : fallback;
}

export async function salvarHorario(formData: FormData) {
  const session = await requireSession();

  const weekday = Number(formData.get("weekday"));
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return;

  const active = formData.get("active") === "on";
  const openTime = normalizeTime(formData.get("openTime"), "18:00");
  const closeTime = normalizeTime(formData.get("closeTime"), "23:00");

  // Sem unique em [storeId, weekday]: faz findFirst + update/create.
  const existing = await prisma.businessHour.findFirst({
    where: { storeId: session.storeId, weekday },
  });

  if (existing) {
    await prisma.businessHour.update({
      where: { id: existing.id },
      data: { openTime, closeTime, active },
    });
  } else {
    await prisma.businessHour.create({
      data: { storeId: session.storeId, weekday, openTime, closeTime, active },
    });
  }

  revalidatePath("/painel/horarios");
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function criarCliente(formData: FormData) {
  const session = await requireSession();

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name || !phone) return;

  // upsert por [storeId, phone]: se já existir, atualiza o nome; senão cria.
  await prisma.customer.upsert({
    where: { storeId_phone: { storeId: session.storeId, phone } },
    update: { name },
    create: { storeId: session.storeId, name, phone },
  });

  revalidatePath("/painel/clientes");
}

export async function excluirCliente(id: string) {
  const session = await requireSession();

  // escopado por storeId para garantir o isolamento multi-tenant
  await prisma.customer.deleteMany({
    where: { id, storeId: session.storeId },
  });

  revalidatePath("/painel/clientes");
}

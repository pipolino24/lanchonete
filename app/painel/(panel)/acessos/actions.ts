"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

const ROLES = ["OWNER", "MANAGER", "STAFF"] as const;
type Role = (typeof ROLES)[number];

export async function criarUsuario(formData: FormData) {
  const session = await requireSession();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "");
  const roleRaw = String(formData.get("role") ?? "STAFF");
  const role: Role = (ROLES as readonly string[]).includes(roleRaw)
    ? (roleRaw as Role)
    : "STAFF";

  if (!name || !email || !password) return;

  // email é @unique globalmente — evita quebra ao tentar criar duplicado.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        storeId: session.storeId,
        name,
        email,
        passwordHash,
        role,
      },
    });
  } catch {
    // corrida de unicidade do email — ignora sem quebrar.
    return;
  }

  revalidatePath("/painel/acessos");
}

export async function alternarUsuario(id: string) {
  const session = await requireSession();

  const user = await prisma.user.findFirst({
    where: { id, storeId: session.storeId },
  });
  if (!user) return;

  // não deixe desativar o próprio usuário da sessão.
  if (user.id === session.id) return;

  // não deixe desativar o último OWNER ativo.
  if (user.active && user.role === "OWNER") {
    const activeOwners = await prisma.user.count({
      where: { storeId: session.storeId, role: "OWNER", active: true },
    });
    if (activeOwners <= 1) return;
  }

  await prisma.user.updateMany({
    where: { id, storeId: session.storeId },
    data: { active: !user.active },
  });

  revalidatePath("/painel/acessos");
}

export async function excluirUsuario(id: string) {
  const session = await requireSession();

  // não permita excluir o próprio usuário da sessão.
  if (id === session.id) return;

  const user = await prisma.user.findFirst({
    where: { id, storeId: session.storeId },
  });
  if (!user) return;

  // não permita excluir o último OWNER ativo.
  if (user.role === "OWNER" && user.active) {
    const activeOwners = await prisma.user.count({
      where: { storeId: session.storeId, role: "OWNER", active: true },
    });
    if (activeOwners <= 1) return;
  }

  await prisma.user.deleteMany({
    where: { id, storeId: session.storeId },
  });

  revalidatePath("/painel/acessos");
}

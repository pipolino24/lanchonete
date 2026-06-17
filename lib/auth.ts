import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("AUTH_SECRET é obrigatório em produção (sessões usariam um segredo público).");
}
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev_secret_change_me_please_min_32_chars_long",
);
const COOKIE = "cariri_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  storeId: string;
};

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.sub as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.active) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      storeId: user.storeId,
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/painel/login");
  return session;
}

/** Exige sessão + um dos cargos informados (ex.: gestão de acessos). */
export async function requireRole(roles: string[]): Promise<SessionUser> {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    throw new Error("Você não tem permissão para esta ação.");
  }
  return session;
}

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.active) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

/**
 * Integração com o microserviço de OTP via WhatsApp (Evolution API + n8n).
 * A API key fica SOMENTE no servidor (env) — nunca vai para o navegador.
 *
 * Configure no .env (local) e na Vercel (produção):
 *   OTP_SERVICE_URL=http://3.129.95.174:3000   (opcional — esse é o padrão)
 *   OTP_SERVICE_KEY=<sua api key>               (obrigatório)
 */

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev_secret_change_me_please_min_32_chars_long",
);
const OTP_URL = (process.env.OTP_SERVICE_URL || "http://3.129.95.174:3000").replace(/\/$/, "");
const OTP_KEY = process.env.OTP_SERVICE_KEY || "";
const CUST_COOKIE = "cariri_customer";

export function otpConfigured(): boolean {
  return OTP_KEY.length > 0;
}

/** Para o serviço: DDI+DDD+número (ex.: 5588912345678). */
export function normalizePhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  return d.startsWith("55") ? d : "55" + d;
}

export async function sendOtp(phone: string): Promise<{ ok: boolean; error?: string }> {
  if (!otpConfigured()) return { ok: false, error: "not-configured" };
  try {
    const res = await fetch(`${OTP_URL}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": OTP_KEY },
      body: JSON.stringify({ phone: normalizePhone(phone) }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error || `status_${res.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: "unreachable" };
  }
}

export async function checkOtp(phone: string, code: string): Promise<{ valid: boolean; error?: string }> {
  if (!otpConfigured()) return { valid: false, error: "not-configured" };
  try {
    const res = await fetch(`${OTP_URL}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": OTP_KEY },
      body: JSON.stringify({ phone: normalizePhone(phone), code }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { valid: false, error: data?.error || `status_${res.status}` };
    return { valid: !!data?.valid };
  } catch {
    return { valid: false, error: "unreachable" };
  }
}

/** Marca o telefone como verificado (cookie httpOnly assinado, 2h). */
export async function setVerifiedCookie(storeId: string, phone: string): Promise<void> {
  const token = await new SignJWT({ storeId, phone })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret);
  const store = await cookies();
  store.set(CUST_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 2,
    path: "/",
  });
}

/** Retorna o telefone verificado por cookie para esta loja (ou null). */
export async function getVerifiedPhone(storeId: string): Promise<string | null> {
  const store = await cookies();
  const token = store.get(CUST_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.storeId !== storeId) return null;
    return (payload.phone as string) ?? null;
  } catch {
    return null;
  }
}

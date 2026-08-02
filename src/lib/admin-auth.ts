import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_SECONDS,
} from "@/lib/vip-access";

function getAdminPassword() {
  const password = process.env.VIP_ADMIN_PASSWORD;
  if (!password) throw new Error("VIP_ADMIN_PASSWORD mangler.");
  return password;
}

function getSigningSecret() {
  const secret = process.env.VIP_SESSION_SECRET;
  if (!secret) throw new Error("VIP_SESSION_SECRET mangler.");
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSigningSecret()).update(value).digest("base64url");
}

export function isAdminPasswordValid(password: string) {
  const expected = Buffer.from(getAdminPassword());
  const received = Buffer.from(password);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function createAdminToken() {
  const expiresAt = Date.now() + ADMIN_SESSION_SECONDS * 1000;
  return `${expiresAt}.${sign(String(expiresAt))}`;
}

export function isAdminTokenValid(token?: string) {
  if (!token) return false;
  const [expiresAtValue, signature] = token.split(".");
  const expiresAt = Number(expiresAtValue);
  if (!expiresAt || expiresAt <= Date.now() || !signature) return false;

  const expected = Buffer.from(sign(expiresAtValue));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  return isAdminTokenValid(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

import { createHash, randomBytes } from "node:crypto";

export const DEFAULT_ACCESS_DAYS = 90;
export const MAX_FIXED_ACCESS_DAYS = 3650;
export const MIN_ACCESS_DAYS = 1;
export const LONG_LIVED_COOKIE_DAYS = 400;
export const ACCESS_COOKIE_NAME = "dtvip_access";
export const ADMIN_COOKIE_NAME = "dtvip_admin";
export const ADMIN_SESSION_SECONDS = 12 * 60 * 60;

export type AccessCodeRecord = {
  codeHash: string;
  codeSuffix: string;
  comment: string;
  durationDays: number | null;
  createdAt: number;
  claimedAt?: number;
  claimedName?: string;
  expiresAt?: number;
  lastSeenAt?: number;
  sessionHash?: string;
  revokedAt?: number;
};

export type AccessSession = {
  codeHash: string;
  name: string;
  durationDays: number | null;
  createdAt: number;
  expiresAt?: number;
  checkInUntil?: number;
};

export type PublicAccessSession = Pick<AccessSession, "name" | "expiresAt" | "checkInUntil">;

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function generateAccessCode() {
  const bytes = randomBytes(10);
  const characters = Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]);
  return `DTVIP-${characters.slice(0, 5).join("")}-${characters.slice(5).join("")}`;
}

export function generateSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function clampDurationDays(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed)) return DEFAULT_ACCESS_DAYS;
  return Math.min(MAX_FIXED_ACCESS_DAYS, Math.max(MIN_ACCESS_DAYS, parsed));
}

export function durationSeconds(days: number) {
  return days * 24 * 60 * 60;
}

export function getCodeStatus(record: AccessCodeRecord) {
  if (record.revokedAt) return "revoked" as const;
  if (record.expiresAt && record.expiresAt <= Date.now()) return "expired" as const;
  if (record.claimedAt) return "active" as const;
  return "unused" as const;
}

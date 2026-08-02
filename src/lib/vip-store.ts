import { getRedis } from "@/lib/redis";
import {
  AccessCodeRecord,
  AccessSession,
  hashSecret,
} from "@/lib/vip-access";

const ACCESS_CODES_KEY = "dtvip:access-codes";
const SESSION_PREFIX = "dtvip:session:";

export async function listAccessCodes() {
  const values = await getRedis().hvals(ACCESS_CODES_KEY) as AccessCodeRecord[];
  return values.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAccessCode(codeHash: string) {
  return getRedis().hget<AccessCodeRecord>(ACCESS_CODES_KEY, codeHash);
}

export async function saveAccessCode(record: AccessCodeRecord) {
  await getRedis().hset(ACCESS_CODES_KEY, { [record.codeHash]: record });
}

export async function deleteAccessCode(codeHash: string) {
  await getRedis().hdel(ACCESS_CODES_KEY, codeHash);
}

export async function saveAccessSession(token: string, session: AccessSession) {
  const sessionHash = hashSecret(token);
  const ttlSeconds = session.expiresAt
    ? Math.max(1, Math.ceil((session.expiresAt - Date.now()) / 1000))
    : undefined;
  if (ttlSeconds) {
    await getRedis().set(`${SESSION_PREFIX}${sessionHash}`, session, { ex: ttlSeconds });
  } else {
    await getRedis().set(`${SESSION_PREFIX}${sessionHash}`, session);
  }
  return sessionHash;
}

export async function getAccessSession(token: string) {
  return getRedis().get<AccessSession>(`${SESSION_PREFIX}${hashSecret(token)}`);
}

export async function deleteAccessSession(sessionHash?: string) {
  if (!sessionHash) return;
  await getRedis().del(`${SESSION_PREFIX}${sessionHash}`);
}

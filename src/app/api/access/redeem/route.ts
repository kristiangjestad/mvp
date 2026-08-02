import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  AccessSession,
  durationSeconds,
  generateSessionToken,
  hashSecret,
  LONG_LIVED_COOKIE_DAYS,
  normalizeCode,
} from "@/lib/vip-access";
import {
  getAccessCode,
  saveAccessCode,
  saveAccessSession,
} from "@/lib/vip-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: unknown; name?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const code = typeof body.code === "string" ? normalizeCode(body.code) : "";

    if (!name || !code) {
      return NextResponse.json({ error: "Skriv inn navn og kode." }, { status: 400 });
    }

    const codeHash = hashSecret(code);
    const record = await getAccessCode(codeHash);
    if (!record || record.revokedAt) {
      return NextResponse.json({ error: "Koden er ikke gyldig." }, { status: 401 });
    }
    if (record.claimedAt) {
      return NextResponse.json({ error: "Koden er allerede brukt på en annen enhet." }, { status: 409 });
    }

    const now = Date.now();
    const expiresAt = record.durationDays
      ? now + durationSeconds(record.durationDays) * 1000
      : undefined;
    const token = generateSessionToken();
    const session: AccessSession = {
      codeHash,
      name,
      durationDays: record.durationDays,
      createdAt: now,
      expiresAt,
    };
    const sessionHash = await saveAccessSession(token, session);
    await saveAccessCode({
      ...record,
      claimedAt: now,
      claimedName: name,
      expiresAt,
      lastSeenAt: now,
      sessionHash,
    });

    const response = NextResponse.json({ session: { name, expiresAt } });
    response.cookies.set(ACCESS_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: durationSeconds(record.durationDays ?? LONG_LIVED_COOKIE_DAYS),
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Kunne ikke aktivere koden akkurat nå." }, { status: 503 });
  }
}

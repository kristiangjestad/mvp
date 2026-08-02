import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  durationSeconds,
  hashSecret,
  LONG_LIVED_COOKIE_DAYS,
  PublicAccessSession,
} from "@/lib/vip-access";
import {
  getAccessCode,
  getAccessSession,
  saveAccessCode,
  saveAccessSession,
} from "@/lib/vip-store";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ session: null });

    const session = await getAccessSession(token);
    if (!session || (session.expiresAt && session.expiresAt <= Date.now())) {
      const response = NextResponse.json({ session: null });
      response.cookies.set(ACCESS_COOKIE_NAME, "", { maxAge: 0, path: "/" });
      return response;
    }

    const record = await getAccessCode(session.codeHash);
    if (!record || record.revokedAt || record.sessionHash !== hashSecret(token)) {
      const response = NextResponse.json({ session: null });
      response.cookies.set(ACCESS_COOKIE_NAME, "", { maxAge: 0, path: "/" });
      return response;
    }

    const now = Date.now();
    const refreshed = session;
    await Promise.all([
      session.durationDays === null ? saveAccessSession(token, refreshed) : Promise.resolve(),
      saveAccessCode({ ...record, lastSeenAt: now }),
    ]);

    const publicSession: PublicAccessSession = {
      name: refreshed.name,
      expiresAt: refreshed.expiresAt,
      checkInUntil: refreshed.checkInUntil,
    };
    const response = NextResponse.json({ session: publicSession });
    response.cookies.set(ACCESS_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: session.expiresAt
        ? Math.max(1, Math.ceil((session.expiresAt - now) / 1000))
        : durationSeconds(LONG_LIVED_COOKIE_DAYS),
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Kunne ikke kontrollere tilgangen." }, { status: 503 });
  }
}

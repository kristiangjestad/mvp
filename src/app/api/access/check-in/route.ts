import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, hashSecret } from "@/lib/vip-access";
import { getAccessCode, getAccessSession, saveAccessSession } from "@/lib/vip-store";

const CHECK_IN_DURATION_MS = 8 * 60 * 60 * 1000;

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Ikke innlogget." }, { status: 401 });

    const session = await getAccessSession(token);
    if (!session || (session.expiresAt && session.expiresAt <= Date.now())) {
      return NextResponse.json({ error: "Tilgangen har utløpt." }, { status: 401 });
    }

    const record = await getAccessCode(session.codeHash);
    if (!record || record.revokedAt || record.sessionHash !== hashSecret(token)) {
      return NextResponse.json({ error: "Tilgangen er sperret." }, { status: 401 });
    }

    const checkInUntil = Date.now() + CHECK_IN_DURATION_MS;
    await saveAccessSession(token, { ...session, checkInUntil });
    return NextResponse.json({ checkInUntil });
  } catch {
    return NextResponse.json({ error: "Kunne ikke sjekke inn." }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import {
  createAdminToken,
  isAdminPasswordValid,
  requireAdmin,
} from "@/lib/admin-auth";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_SECONDS,
} from "@/lib/vip-access";

export async function GET() {
  return NextResponse.json({ authenticated: await requireAdmin() });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password !== "string" || !isAdminPasswordValid(body.password)) {
      return NextResponse.json({ error: "Feil adminpassord." }, { status: 401 });
    }

    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(ADMIN_COOKIE_NAME, createAdminToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: ADMIN_SESSION_SECONDS,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Kunne ikke logge inn." }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(ADMIN_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return response;
}

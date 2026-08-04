import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  deleteAccessCode,
  deleteAccessSession,
  getAccessCode,
  saveAccessCode,
} from "@/lib/vip-store";

type Context = { params: Promise<{ codeHash: string }> };

export async function PATCH(request: Request, { params }: Context) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ikke innlogget." }, { status: 401 });
  }

  try {
    const { codeHash } = await params;
    const body = (await request.json()) as { action?: unknown };
    const record = await getAccessCode(codeHash);
    if (!record) {
      return NextResponse.json({ error: "Koden finnes ikke." }, { status: 404 });
    }

    if (body.action === "reset") {
      await deleteAccessSession(record.sessionHash);
      const reset = {
        codeHash: record.codeHash,
        code: record.code,
        codeSuffix: record.codeSuffix,
        comment: record.comment,
        durationDays: record.durationDays,
        createdAt: record.createdAt,
      };
      await saveAccessCode(reset);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "revoke") {
      await deleteAccessSession(record.sessionHash);
      await saveAccessCode({ ...record, revokedAt: Date.now() });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ukjent handling." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Kunne ikke oppdatere koden." }, { status: 503 });
  }
}

export async function DELETE(_: Request, { params }: Context) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ikke innlogget." }, { status: 401 });
  }

  try {
    const { codeHash } = await params;
    const record = await getAccessCode(codeHash);
    if (!record) return NextResponse.json({ ok: true });
    await Promise.all([
      deleteAccessSession(record.sessionHash),
      deleteAccessCode(codeHash),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Kunne ikke slette koden." }, { status: 503 });
  }
}

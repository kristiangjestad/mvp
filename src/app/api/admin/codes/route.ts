import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  AccessCodeRecord,
  clampDurationDays,
  generateAccessCode,
  getCodeStatus,
  hashSecret,
} from "@/lib/vip-access";
import {
  getAccessCode,
  listAccessCodes,
  saveAccessCode,
} from "@/lib/vip-store";

function serializeRecord(record: AccessCodeRecord) {
  return {
    ...record,
    sessionHash: undefined,
    status: getCodeStatus(record),
  };
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ikke innlogget." }, { status: 401 });
  }

  try {
    const records = await listAccessCodes();
    return NextResponse.json({ codes: records.map(serializeRecord) });
  } catch {
    return NextResponse.json({ error: "Kunne ikke hente kodene." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ikke innlogget." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { comment?: unknown; durationDays?: unknown; unlimited?: unknown };
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";
    if (!comment) {
      return NextResponse.json({ error: "Skriv hvem koden er til." }, { status: 400 });
    }

    const durationDays = body.unlimited === true ? null : clampDurationDays(body.durationDays);
    let code = generateAccessCode();
    let codeHash = hashSecret(code);
    for (let attempt = 0; attempt < 3 && (await getAccessCode(codeHash)); attempt += 1) {
      code = generateAccessCode();
      codeHash = hashSecret(code);
    }

    const record: AccessCodeRecord = {
      codeHash,
      code,
      codeSuffix: code.slice(-5),
      comment,
      durationDays,
      createdAt: Date.now(),
    };
    await saveAccessCode(record);

    return NextResponse.json({ code, record: serializeRecord(record) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Kunne ikke opprette koden." }, { status: 503 });
  }
}

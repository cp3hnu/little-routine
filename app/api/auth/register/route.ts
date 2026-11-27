import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      phone?: string;
      password?: string;
      nickname?: string;
      familyName?: string;
      locale?: string;
    };
    if (!body.phone || !body.password || !body.nickname) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }
    await registerUser({
      phone: body.phone,
      password: body.password,
      nickname: body.nickname,
      familyName: body.familyName,
      locale: body.locale,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ERROR";
    const status = message === "PHONE_TAKEN" ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

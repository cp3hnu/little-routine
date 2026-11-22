import { NextResponse } from "next/server";
import { loginUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string; password?: string };
    if (!body.phone || !body.password) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }
    await loginUser(body.phone, body.password);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }
}

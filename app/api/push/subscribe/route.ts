import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { newId } from "@/lib/crypto";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "INVALID_SUBSCRIPTION" }, { status: 400 });
  }

  const db = await getDb();
  const [existing] = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, body.endpoint))
    .limit(1);

  if (existing) {
    await db
      .update(pushSubscriptions)
      .set({
        userId: user.id,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        enabled: true,
      })
      .where(eq(pushSubscriptions.id, existing.id));
  } else {
    await db.insert(pushSubscriptions).values({
      id: newId(),
      userId: user.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      enabled: true,
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { endpoint?: string };
  if (!body.endpoint) return NextResponse.json({ error: "MISSING" }, { status: 400 });
  const db = await getDb();
  await db
    .update(pushSubscriptions)
    .set({ enabled: false })
    .where(eq(pushSubscriptions.endpoint, body.endpoint));
  return NextResponse.json({ ok: true });
}

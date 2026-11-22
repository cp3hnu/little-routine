import { NextResponse } from "next/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { assertChildAccess, getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { sleepLogs } from "@/lib/db/schema";
import { newId } from "@/lib/crypto";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const childId = url.searchParams.get("childId");
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  if (!childId) return NextResponse.json({ error: "MISSING_CHILD" }, { status: 400 });
  try {
    await assertChildAccess(user.id, childId);
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const db = await getDb();
  const conditions = [eq(sleepLogs.childId, childId)];
  if (start) conditions.push(gte(sleepLogs.localDate, start));
  if (end) conditions.push(lte(sleepLogs.localDate, end));
  const logs = await db
    .select()
    .from(sleepLogs)
    .where(and(...conditions));
  return NextResponse.json({ logs });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    childId?: string;
    localDate?: string;
    wakeAt?: string | null;
    sleepAt?: string | null;
    note?: string | null;
  };
  if (!body.childId || !body.localDate) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }
  try {
    await assertChildAccess(user.id, body.childId);
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const db = await getDb();
  const [existing] = await db
    .select()
    .from(sleepLogs)
    .where(and(eq(sleepLogs.childId, body.childId), eq(sleepLogs.localDate, body.localDate)))
    .limit(1);

  const now = new Date().toISOString();
  if (existing) {
    await db
      .update(sleepLogs)
      .set({
        wakeAt: body.wakeAt === undefined ? existing.wakeAt : body.wakeAt,
        sleepAt: body.sleepAt === undefined ? existing.sleepAt : body.sleepAt,
        note: body.note === undefined ? existing.note : body.note,
        updatedAt: now,
      })
      .where(eq(sleepLogs.id, existing.id));
    return NextResponse.json({ id: existing.id });
  }

  const id = newId();
  await db.insert(sleepLogs).values({
    id,
    childId: body.childId,
    localDate: body.localDate,
    wakeAt: body.wakeAt ?? null,
    sleepAt: body.sleepAt ?? null,
    note: body.note ?? null,
    updatedAt: now,
  });
  return NextResponse.json({ id });
}

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { assertChildAccess, getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { reminderPrefs } from "@/lib/db/schema";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const childId = new URL(request.url).searchParams.get("childId");
  if (!childId) return NextResponse.json({ error: "MISSING_CHILD" }, { status: 400 });
  try {
    await assertChildAccess(user.id, childId);
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const db = await getDb();
  const [prefs] = await db.select().from(reminderPrefs).where(eq(reminderPrefs.childId, childId)).limit(1);
  return NextResponse.json({
    prefs: prefs ?? { childId, wakeRemind: true, sleepRemind: true, minutesBefore: 15 },
  });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    childId?: string;
    wakeRemind?: boolean;
    sleepRemind?: boolean;
    minutesBefore?: number;
  };
  if (!body.childId) return NextResponse.json({ error: "MISSING_CHILD" }, { status: 400 });
  try {
    await assertChildAccess(user.id, body.childId);
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const db = await getDb();
  const [existing] = await db
    .select()
    .from(reminderPrefs)
    .where(eq(reminderPrefs.childId, body.childId))
    .limit(1);
  const values = {
    wakeRemind: body.wakeRemind ?? true,
    sleepRemind: body.sleepRemind ?? true,
    minutesBefore: body.minutesBefore ?? 15,
  };
  if (existing) {
    await db.update(reminderPrefs).set(values).where(eq(reminderPrefs.childId, body.childId));
  } else {
    await db.insert(reminderPrefs).values({ childId: body.childId, ...values });
  }
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSessionUser, getUserFamily } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { children, reminderPrefs } from "@/lib/db/schema";
import { newId } from "@/lib/crypto";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const family = await getUserFamily(user.id);
  if (!family) return NextResponse.json({ children: [] });
  const db = await getDb();
  const list = await db.select().from(children).where(eq(children.familyId, family.family.id));
  return NextResponse.json({ children: list });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const family = await getUserFamily(user.id);
  if (!family) return NextResponse.json({ error: "NO_FAMILY" }, { status: 400 });

  const body = (await request.json()) as {
    name?: string;
    targetWakeTime?: string;
    targetSleepTime?: string;
  };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "MISSING_NAME" }, { status: 400 });
  }

  const id = newId();
  const db = await getDb();
  await db.insert(children).values({
    id,
    familyId: family.family.id,
    name: body.name.trim(),
    targetWakeTime: body.targetWakeTime || "07:00",
    targetSleepTime: body.targetSleepTime || "21:30",
  });
  await db.insert(reminderPrefs).values({ childId: id });
  return NextResponse.json({ id });
}

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { assertChildAccess, getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { children } from "@/lib/db/schema";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    await assertChildAccess(user.id, id);
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    targetWakeTime?: string;
    targetSleepTime?: string;
  };
  const db = await getDb();
  await db
    .update(children)
    .set({
      ...(body.name ? { name: body.name.trim() } : {}),
      ...(body.targetWakeTime ? { targetWakeTime: body.targetWakeTime } : {}),
      ...(body.targetSleepTime ? { targetSleepTime: body.targetSleepTime } : {}),
    })
    .where(eq(children.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    await assertChildAccess(user.id, id);
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const db = await getDb();
  await db.delete(children).where(eq(children.id, id));
  return NextResponse.json({ ok: true });
}

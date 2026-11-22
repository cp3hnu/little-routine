import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSessionUser, getUserFamily } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null });
  const family = await getUserFamily(user.id);
  return NextResponse.json({
    user: {
      id: user.id,
      phone: user.phone,
      locale: user.locale,
      theme: user.theme,
    },
    family: family
      ? { id: family.family.id, name: family.family.name, timezone: family.family.timezone }
      : null,
  });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { locale?: string; theme?: string };
  const db = await getDb();
  await db
    .update(users)
    .set({
      locale: body.locale === "en" ? "en" : body.locale === "zh" ? "zh" : user.locale,
      theme:
        body.theme === "light" || body.theme === "dark" || body.theme === "system"
          ? body.theme
          : user.theme,
    })
    .where(eq(users.id, user.id));
  return NextResponse.json({ ok: true });
}

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSessionUser, getUserFamily } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { children } from "@/lib/db/schema";
import { HomeCheckin } from "@/components/home-checkin";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const family = await getUserFamily(user.id);
  const db = await getDb();
  const list = family
    ? await db.select().from(children).where(eq(children.familyId, family.family.id))
    : [];

  return (
    <HomeCheckin
      childrenList={list.map((c) => ({
        id: c.id,
        name: c.name,
        targetWakeTime: c.targetWakeTime,
        targetSleepTime: c.targetSleepTime,
      }))}
    />
  );
}

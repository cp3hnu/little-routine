import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSessionUser, getUserFamily } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { children } from "@/lib/db/schema";
import { SettingsPanel } from "@/components/settings-panel";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const family = await getUserFamily(user.id);
  const db = await getDb();
  const list = family
    ? await db.select().from(children).where(eq(children.familyId, family.family.id))
    : [];

  return (
    <SettingsPanel
      initialChildren={list.map((c) => ({
        id: c.id,
        name: c.name,
        targetWakeTime: c.targetWakeTime,
        targetSleepTime: c.targetSleepTime,
      }))}
      firstChildId={list[0]?.id}
    />
  );
}

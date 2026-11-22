import { NextResponse } from "next/server";
import { assertChildAccess, getSessionUser } from "@/lib/auth";
import { getOrCreateReport } from "@/lib/reports";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const childId = url.searchParams.get("childId");
  const periodType = url.searchParams.get("periodType") as "month" | "year" | null;
  const periodKey = url.searchParams.get("periodKey");
  const force = url.searchParams.get("force") === "1";
  const locale = url.searchParams.get("locale") || user.locale || "zh";

  if (!childId || !periodType || !periodKey || !["month", "year"].includes(periodType)) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  try {
    await assertChildAccess(user.id, childId);
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const report = await getOrCreateReport({
    childId,
    periodType,
    periodKey,
    locale,
    force,
  });
  return NextResponse.json(report);
}

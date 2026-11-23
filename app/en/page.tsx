import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LandingPage } from "@/components/landing-page";
import { landingMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = landingMetadata("en");

export default async function EnglishLandingPage() {
  const user = await getSessionUser().catch(() => null);
  if (user) redirect("/");
  return <LandingPage locale="en" />;
}

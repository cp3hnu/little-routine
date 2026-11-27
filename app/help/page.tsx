import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { InstallGuide } from "@/components/install-guide";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { noIndexMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = noIndexMetadata("帮助");

export default async function HelpPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const locale = user.locale === "en" ? "en" : "zh";
  const t = getDictionary(locale);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-3 text-center sm:text-left">
        <p className="text-sm font-semibold tracking-wide text-(--accent)">{t.help}</p>
        <h1 className="text-3xl font-extrabold tracking-tight">{t.helpTitle}</h1>
        <p className="text-sm leading-relaxed text-(--muted) sm:text-base">{t.helpSubtitle}</p>
      </header>
      <InstallGuide />
    </div>
  );
}

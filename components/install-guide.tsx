"use client";

import { CircleAlertIcon, MonitorIcon, SmartphoneIcon, TabletIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/components/locale-provider";
import { getHelpContent, type InstallGuideSection } from "@/lib/help-content";

const GUIDE_ICONS: Record<InstallGuideSection["id"], LucideIcon> = {
  pc: MonitorIcon,
  phone: SmartphoneIcon,
  tablet: TabletIcon,
};

export function InstallGuide() {
  const { locale, t } = useI18n();
  const content = getHelpContent(locale);

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label={t.help} className="flex gap-2 overflow-x-auto pb-1">
        {content.guides.map((guide) => {
          const Icon = GUIDE_ICONS[guide.id];
          return (
            <a
              key={guide.id}
              href={`#${guide.id}`}
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-(--border) bg-(--bg-elevated) px-3.5 text-sm font-medium text-(--ink) transition-colors hover:border-(--accent)/40 hover:bg-(--accent-soft)"
            >
              <Icon className="size-4" />
              {guide.title}
            </a>
          );
        })}
      </nav>

      <aside className="flex gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <CircleAlertIcon className="mt-0.5 size-5 shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold">{content.inAppBrowserWarning.title}</p>
          <p className="text-sm leading-relaxed opacity-90">{content.inAppBrowserWarning.body}</p>
        </div>
      </aside>

      <p className="text-sm leading-relaxed text-(--muted) sm:text-base">{content.intro}</p>

      <div className="flex flex-col gap-6">
        {content.guides.map((guide) => {
          const Icon = GUIDE_ICONS[guide.id];
          return (
            <section key={guide.id} id={guide.id} className="card scroll-mt-24 space-y-5 p-5 md:scroll-mt-8">
              <header className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-(--accent-soft) text-(--accent)">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{guide.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-(--muted)">{guide.summary}</p>
                </div>
              </header>

              <div className="flex flex-col gap-6">
                {guide.methods.map((method) => (
                  <div key={method.title}>
                    <h3 className="text-base font-bold">{method.title}</h3>
                    <ol className="mt-3 flex flex-col gap-3">
                      {method.steps.map((step, index) => (
                        <li key={step} className="flex gap-3">
                          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-(--accent-soft) text-xs font-bold text-(--accent)">
                            {index + 1}
                          </span>
                          <p className="text-sm leading-relaxed text-(--muted)">{step}</p>
                        </li>
                      ))}
                    </ol>
                    {method.note ? (
                      <p className="mt-3 rounded-2xl bg-(--accent-soft)/50 px-3 py-2 text-xs leading-relaxed text-(--muted)">
                        {method.note}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">{locale === "en" ? "After installing" : "安装后还要注意"}</h2>
        <div className="flex flex-col gap-3">
          {content.tips.map((tip) => (
            <article key={tip.title} className="card p-5">
              <h3 className="text-base font-bold">{tip.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-(--muted)">{tip.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

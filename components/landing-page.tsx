import Link from "next/link";
import type { Locale } from "@/lib/i18n/dictionaries";
import { getLandingCopy } from "@/lib/i18n/landing";
import { buildWebAppJsonLd } from "@/lib/seo";
import { HtmlLang } from "@/components/html-lang";

export function LandingPage({ locale }: { locale: Locale }) {
  const t = getLandingCopy(locale);
  const jsonLd = buildWebAppJsonLd(locale);
  const htmlLang = locale === "zh" ? "zh-CN" : "en";

  return (
    <div className="landing" lang={htmlLang}>
      <HtmlLang lang={htmlLang} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="landing-top">
        <p className="landing-brand">
          <span className="landing-brand-primary">{t.brand}</span>
          <span className="landing-brand-secondary">{t.brandEn}</span>
        </p>
        <Link href={t.langHref} className="landing-lang" hrefLang={locale === "zh" ? "en" : "zh-CN"}>
          {t.langSwitch}
        </Link>
      </header>

      <section className="landing-hero" aria-labelledby="landing-headline">
        <div className="landing-hero-glow" aria-hidden />
        <div className="landing-hero-orbit" aria-hidden>
          <span className="landing-orbit-wake" />
          <span className="landing-orbit-sleep" />
        </div>
        <h1 id="landing-headline" className="landing-headline">
          {t.headline}
        </h1>
        <p className="landing-subhead">{t.subhead}</p>
        <div className="landing-cta">
          <Link href="/register" className="btn btn-primary landing-cta-primary">
            {t.ctaPrimary}
          </Link>
          <Link href="/login" className="btn landing-cta-secondary">
            {t.ctaSecondary}
          </Link>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="landing-features-title">
        <h2 id="landing-features-title" className="landing-section-title">
          {t.featuresTitle}
        </h2>
        <p className="landing-section-lead">{t.featuresLead}</p>
        <ul className="landing-feature-list">
          {t.features.map((feature) => (
            <li key={feature.title} className="landing-feature">
              <h3 className="landing-feature-title">{feature.title}</h3>
              <p className="landing-feature-body">{feature.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-section landing-section-steps" aria-labelledby="landing-steps-title">
        <h2 id="landing-steps-title" className="landing-section-title">
          {t.stepsTitle}
        </h2>
        <p className="landing-section-lead">{t.stepsLead}</p>
        <ol className="landing-steps">
          {t.steps.map((step, index) => (
            <li key={step.title} className="landing-step">
              <span className="landing-step-index" aria-hidden>
                {index + 1}
              </span>
              <div>
                <h3 className="landing-feature-title">{step.title}</h3>
                <p className="landing-feature-body">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <footer className="landing-footer">
        <p>{t.footerNote}</p>
        <p className="landing-footer-links">
          <Link href="/register">{t.ctaPrimary}</Link>
          <span aria-hidden>·</span>
          <Link href={t.langHref} hrefLang={locale === "zh" ? "en" : "zh-CN"}>
            {t.langSwitch}
          </Link>
        </p>
      </footer>
    </div>
  );
}

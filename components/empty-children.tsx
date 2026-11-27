"use client";

import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { useI18n } from "./locale-provider";

export function EmptyChildren({
  ctaHref = "/settings",
  ctaLabel,
  onCta,
  centered = false,
}: {
  ctaHref?: string;
  ctaLabel?: string;
  onCta?: () => void;
  centered?: boolean;
}) {
  const { t } = useI18n();
  const label = ctaLabel || t.addChild;

  const content = (
    <div className="empty-children">
      <BrandLogo size="lg" />

      <div className="empty-children-copy">
        <p className="empty-children-kicker">{t.emptyChildrenKicker}</p>
        <h2 className="empty-children-title">{t.emptyChildrenTitle}</h2>
        <p className="empty-children-desc">{t.emptyChildrenDesc}</p>
      </div>

      {onCta ? (
        <button type="button" className="empty-children-cta" onClick={onCta}>
          {label}
        </button>
      ) : (
        <Link href={ctaHref} className="empty-children-cta">
          {label}
        </Link>
      )}
    </div>
  );

  if (!centered) return content;
  return <div className="empty-children-stage">{content}</div>;
}

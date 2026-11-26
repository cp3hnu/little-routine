"use client";

import Link from "next/link";
import { useI18n } from "./locale-provider";

export function EmptyChildren({
  ctaHref = "/settings",
  ctaLabel,
  onCta,
}: {
  ctaHref?: string;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  const { t } = useI18n();
  const label = ctaLabel || t.addChild;

  return (
    <div className="empty-children">
      <div className="empty-children-orb" aria-hidden="true">
        <span className="empty-children-sun" />
        <span className="empty-children-moon" />
      </div>

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
}

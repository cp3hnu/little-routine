export function BrandLogo({
  size = "md",
  className = "",
  title,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={`brand-logo brand-logo-${size}${className ? ` ${className}` : ""}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <span className="brand-logo-sun" />
      <span className="brand-logo-moon" />
    </span>
  );
}

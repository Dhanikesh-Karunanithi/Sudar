import type { ReactNode } from "react";

type AccentStyle = "word" | "underline" | "none";

type GatewayHeadlineProps = {
  as?: "h1" | "h2";
  badge?: string;
  children: ReactNode;
  /** Text highlighted with brand ember (single phrase, no gradient). */
  accent?: string;
  accentStyle?: AccentStyle;
  /** When true, accent phrase starts on a new line (hero-style). */
  accentOnNewLine?: boolean;
  align?: "left" | "center";
  className?: string;
  subtitle?: string;
};

export function GatewayHeadline({
  as: Tag = "h2",
  badge,
  children,
  accent,
  accentStyle = "word",
  accentOnNewLine = false,
  align = "left",
  className = "",
  subtitle,
}: GatewayHeadlineProps) {
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";
  const sizeClass =
    Tag === "h1"
      ? "text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
      : "text-3xl sm:text-4xl md:text-5xl lg:text-6xl";

  const accentClass =
    accentStyle === "underline"
      ? "gateway-accent-underline"
      : accentStyle === "word"
        ? "gateway-accent-word"
        : "";

  return (
    <div className={`flex flex-col gap-4 ${alignClass} ${className}`}>
      {badge ? (
        <span className="px-3 py-1 rounded-full bg-brand-secondary/10 border border-brand-secondary/25 text-xs text-brand-secondary font-medium tracking-wider uppercase">
          {badge}
        </span>
      ) : null}
      <Tag
        className={`${sizeClass} font-heading font-bold tracking-tight text-[var(--text-primary)] leading-[1.08] max-w-3xl`}
      >
        {children}
        {accent ? (
          accentOnNewLine ? (
            <>
              <br />
              <span className={accentClass}>{accent}</span>
            </>
          ) : (
            <>
              {" "}
              <span className={accentClass}>{accent}</span>
            </>
          )
        ) : null}
      </Tag>
      {subtitle ? (
        <p
          className={`text-base md:text-lg text-[var(--text-secondary)] font-normal leading-relaxed max-w-2xl ${align === "center" ? "mx-auto" : ""}`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

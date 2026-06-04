import type { ReactNode } from "react";

type GatewayCtaVariant = "primary" | "secondary";

type GatewayCtaProps = {
  href: string;
  children: ReactNode;
  variant?: GatewayCtaVariant;
  className?: string;
  external?: boolean;
};

const ArrowIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

export function GatewayCta({
  href,
  children,
  variant = "primary",
  className = "",
  external = true,
}: GatewayCtaProps) {
  const base =
    "inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-base font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent";

  const styles =
    variant === "primary"
      ? "bg-[var(--brand-accent)] text-white hover:bg-[var(--primary-hover)] border border-[var(--brand-accent)]"
      : "bg-transparent text-[var(--text-primary)] border border-brand-secondary/40 hover:border-brand-secondary hover:bg-brand-secondary/10";

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`${base} ${styles} ${className}`}
    >
      {children}
      <ArrowIcon />
    </a>
  );
}

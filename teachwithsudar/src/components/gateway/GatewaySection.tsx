import type { ReactNode } from "react";

type GatewaySectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  bordered?: boolean;
};

export function GatewaySection({
  children,
  className = "",
  id,
  bordered = true,
}: GatewaySectionProps) {
  return (
    <section
      id={id}
      className={`relative z-10 py-20 md:py-28 bg-black ${bordered ? "border-t border-[var(--border)]" : ""} ${className}`}
    >
      <div className="max-w-content-wide mx-auto px-6">{children}</div>
    </section>
  );
}

import { ReactNode } from "react";

export function ProseSection({
  title,
  children,
  className = "",
  wide = false,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <section
      className={`mx-auto px-4 py-12 sm:px-6 ${wide ? "max-w-6xl" : "max-w-4xl"} ${className}`}
    >
      {title && (
        <h1 className="mb-8 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {title}
        </h1>
      )}
      <div className="prose prose-slate max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-p:text-foreground prose-li:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:before:content-none prose-code:after:content-none">
        {children}
      </div>
    </section>
  );
}

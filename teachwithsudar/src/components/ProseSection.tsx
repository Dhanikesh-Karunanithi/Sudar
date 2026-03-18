import { ReactNode } from "react";

export function ProseSection({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto max-w-4xl px-4 py-12 sm:px-6 ${className}`}>
      {title && (
        <h1 className="mb-8 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {title}
        </h1>
      )}
      <div className="prose prose-slate max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-p:text-foreground prose-li:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline ">
        {children}
      </div>
    </section>
  );
}

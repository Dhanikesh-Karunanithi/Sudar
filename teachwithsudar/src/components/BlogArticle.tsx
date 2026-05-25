import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { BlogSection } from "@/data/blogPosts";

function renderInlineContent(text: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);

  return tokens.map((token, i) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    }

    const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      const external = href.startsWith("http");
      return external ? (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-accent hover:underline"
        >
          {label}
        </a>
      ) : (
        <Link key={i} href={href} className="font-medium text-accent hover:underline">
          {label}
        </Link>
      );
    }

    return token;
  });
}

function renderCta(cta: { label: string; href: string }, className: string) {
  const external = cta.href.startsWith("http");
  if (external) {
    return (
      <a href={cta.href} target="_blank" rel="noopener noreferrer" className={className}>
        {cta.label} →
      </a>
    );
  }
  return (
    <Link href={cta.href} className={className}>
      {cta.label} →
    </Link>
  );
}

function renderBody(body: string | string[]) {
  const paragraphs = Array.isArray(body) ? body : [body];
  return paragraphs.map((paragraph, i) => (
    <p key={i} className="mt-4 text-base text-foreground leading-7 first:mt-0">
      {renderInlineContent(paragraph)}
    </p>
  ));
}

export function BlogArticle({ sections }: { sections: BlogSection[] }) {
  return (
    <div className="not-prose">
      {sections.map((section, i) => {
        if (section.type === "paragraph") {
          return (
            <div key={i} className="mt-8">
              {section.heading && (
                <h2 className="mb-3 mt-10 text-2xl font-semibold tracking-tight text-foreground first:mt-0">
                  {section.heading}
                </h2>
              )}
              {renderBody(section.body)}
              {section.cta && renderCta(section.cta, "mt-4 inline-block font-medium text-accent hover:underline")}
            </div>
          );
        }

        if (section.type === "list") {
          const ListTag = section.ordered ? "ol" : "ul";
          return (
            <div key={i} className="mt-8">
              {section.heading && (
                <h2 className="mb-3 mt-10 text-2xl font-semibold tracking-tight text-foreground">{section.heading}</h2>
              )}
              <ListTag
                className={`mt-4 space-y-3 pl-6 text-base text-foreground leading-7 ${
                  section.ordered ? "list-decimal" : "list-disc"
                }`}
              >
                {section.items.map((item, j) => (
                  <li key={j} className="pl-1">
                    {renderInlineContent(item)}
                  </li>
                ))}
              </ListTag>
            </div>
          );
        }

        if (section.type === "quote") {
          return (
            <blockquote
              key={i}
              className="mt-8 rounded-r-xl border-l-4 border-accent/60 bg-card-bg/60 px-6 py-5"
            >
              <p className="text-base italic leading-7 text-foreground">&ldquo;{section.text}&rdquo;</p>
              {section.attribution && (
                <footer className="mt-3 text-sm not-italic text-slate-400"> {section.attribution}</footer>
              )}
            </blockquote>
          );
        }

        if (section.type === "image") {
          return (
            <figure key={i} className="mt-10">
              <div className="relative isolate aspect-[16/9] w-full overflow-hidden rounded-xl bg-card-bg shadow-card">
                <Image
                  src={section.src}
                  alt={section.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 896px) 100vw, 896px"
                />
              </div>
              {section.caption && (
                <figcaption className="mt-3 text-sm leading-6 text-slate-400">{section.caption}</figcaption>
              )}
            </figure>
          );
        }

        if (section.type === "references") {
          return (
            <div key={i} className="mt-10">
              <h2 className="mb-4 mt-10 text-2xl font-semibold tracking-tight text-foreground">
                {section.heading ?? "Further reading & research"}
              </h2>
              <ul className="space-y-4">
                {section.refs.map((ref, j) => (
                  <li key={j} className="rounded-lg border border-card-border bg-card-bg/40 p-4">
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-accent hover:underline"
                    >
                      {ref.title}
                    </a>
                    {(ref.authors || ref.year) && (
                      <p className="mt-1 text-sm text-slate-400">
                        {[ref.authors, ref.year].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {ref.note && <p className="mt-2 text-sm leading-6 text-foreground">{ref.note}</p>}
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        if (section.type === "steps") {
          return (
            <div key={i} className="mt-8">
              {section.heading && (
                <h2 className="mb-3 mt-10 text-2xl font-semibold tracking-tight text-foreground">{section.heading}</h2>
              )}
              <ol className="mt-6 list-decimal space-y-6 pl-6">
                {section.steps.map((step, j) => (
                  <li key={j} className="pl-2 text-base leading-7 text-foreground">
                    <span className="font-semibold">{step.title}.</span> {renderInlineContent(step.body)}
                  </li>
                ))}
              </ol>
              {section.cta &&
                renderCta(
                  section.cta,
                  "mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90",
                )}
            </div>
          );
        }

        if (section.type === "pitch") {
          return (
            <aside
              key={i}
              className="mt-12 rounded-2xl border border-accent/30 bg-gradient-to-br from-primary/10 via-card-bg to-card-bg p-8 shadow-card"
            >
              <h2 className="text-xl font-semibold text-foreground">{section.heading ?? "How Sudar helps"}</h2>
              {renderBody(section.body)}
              {section.cta &&
                renderCta(
                  section.cta,
                  "mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90",
                )}
            </aside>
          );
        }

        return null;
      })}
    </div>
  );
}

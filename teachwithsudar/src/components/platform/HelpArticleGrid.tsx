import Link from "next/link";
import type { PublicHelpMeta } from "@/lib/helpCenterPublic";

export function HelpArticleGrid({
  groups,
}: {
  groups: { category: string; label: string; articles: PublicHelpMeta[] }[];
}) {
  return (
    <div className="space-y-10">
      {groups.map((g) => (
        <section key={g.category}>
          <h2 className="text-xl font-semibold text-foreground">{g.label}</h2>
          <ul className="mt-4 grid sm:grid-cols-2 gap-4 list-none pl-0">
            {g.articles.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/help/article/${a.slug}`}
                  className="block rounded-xl border border-card-border bg-card-bg p-5 shadow-card hover:border-primary/25 transition-colors h-full no-underline"
                >
                  <h3 className="font-semibold text-foreground">{a.title}</h3>
                  {a.description ? (
                    <p className="mt-2 text-sm text-foreground-muted leading-relaxed">{a.description}</p>
                  ) : null}
                  <span className="mt-3 inline-block text-sm text-primary font-medium">Read article →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

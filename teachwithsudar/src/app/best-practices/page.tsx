import Link from "next/link";
import { ProseSection } from "@/components/ProseSection";
import { bestPracticeGroups } from "@/data/bestPractices";

export const metadata = {
  title: "Best Practices & Tips",
  description: "Operational tips for Sudar Studio, Learn, paths, ALP, MCP, and production deploys.",
};

export default function BestPracticesPage() {
  return (
    <ProseSection title="Best Practices & Tips" wide>
      <p className="text-lg text-foreground max-w-3xl">
        Practical guidance for teams running Sudar in production. Pair these notes with{" "}
        <Link href="/guides" className="text-primary hover:underline">
          animated walkthroughs
        </Link>{" "}
        and the{" "}
        <Link href="/help/studio" className="text-primary hover:underline">
          help center
        </Link>
        .
      </p>

      <div className="mt-12 space-y-14">
        {bestPracticeGroups.map((group) => (
          <section key={group.title}>
            <h2 className="text-2xl font-semibold text-foreground">{group.title}</h2>
            <div className="mt-6 grid sm:grid-cols-2 gap-6">
              {group.practices.map((p) => (
                <article
                  key={p.id}
                  className="rounded-xl border border-card-border bg-card-bg p-6 shadow-card"
                >
                  <h3 className="font-semibold text-foreground">{p.title}</h3>
                  <p className="mt-2 text-sm text-foreground-muted">{p.summary}</p>
                  <ul className="mt-4 space-y-2 list-disc pl-5 text-sm text-foreground-muted">
                    {p.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    {p.guideSlug ? (
                      <Link href={`/guides/${p.guideSlug}`} className="text-primary hover:underline font-medium">
                        Walkthrough →
                      </Link>
                    ) : null}
                    {p.helpSlug ? (
                      <Link href={`/help/article/${p.helpSlug}`} className="text-primary hover:underline font-medium">
                        Help article →
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </ProseSection>
  );
}

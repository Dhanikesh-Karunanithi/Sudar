import Link from "next/link";
import { ProseSection } from "@/components/ProseSection";
import { loadAllPublicMarketingMetas } from "@/lib/helpCenterPublic";

export const metadata = {
  title: "Sudar Learn Help",
};

export default function LearnHelpPage() {
  const articles = loadAllPublicMarketingMetas("learner");

  return (
    <ProseSection title="Sudar Learn Help">
      <p className="text-lg text-foreground">
        Sudar Learn is the learner app: dashboards, modalities, tutor Sudar, paths, certificates, and memory. Featured
        articles below are synced from the open-source{" "}
        <code className="rounded bg-background-muted px-1.5 py-0.5 text-sm text-foreground">help-center/</code> corpus.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">Guides — marketing-safe excerpts</h2>
      <ul className="mt-4 space-y-3 list-none pl-0">
        {articles.map((a) => (
          <li key={a.slug}>
            <Link href={`/help/article/${a.slug}`} className="text-accent font-semibold hover:underline">
              {a.title}
            </Link>
            {a.description ? (
              <p className="text-foreground-muted text-base mt-1 mb-1 max-w-prose">{a.description}</p>
            ) : null}
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-xl font-semibold text-foreground">Quick reminders</h2>
      <p className="mt-2 text-foreground">
        Use the Sudar tutor for course questions, highlight text for quick prompts, switch modalities from the viewer
        tabs, and open <strong>In-product Help Center</strong> from the Learn sidebar for the full searchable library
        (may include tenant-specific articles admins publish).
      </p>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/help/studio" className="text-accent hover:underline">
          Studio Help →
        </Link>
        <Link href="/modalities" className="text-accent hover:underline">
          Modalities →
        </Link>
        <Link href="/faq" className="text-accent hover:underline">
          FAQ →
        </Link>
      </div>
    </ProseSection>
  );
}

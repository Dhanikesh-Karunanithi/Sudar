import Link from "next/link";
import { HelpArticleGrid } from "@/components/platform/HelpArticleGrid";
import { loadGroupedPublicMarketingMetas } from "@/lib/helpCenterPublic";

type HelpTab = "learn" | "studio";

const TAB_COPY: Record<
  HelpTab,
  { title: string; description: string; mode: "learner" | "admin"; reminder: string }
> = {
  learn: {
    title: "Sudar Learn Help",
    description:
      "Guides for learners: dashboards, modalities, tutor Sudar, paths, certificates, and memory. Articles sync from the open-source help-center corpus.",
    mode: "learner",
    reminder:
      "Use the Sudar tutor for course questions, highlight text for quick prompts, and switch modalities from the viewer tabs. Signed-in learners also get the full searchable Help Center inside Sudar Learn.",
  },
  studio: {
    title: "Sudar Studio Help",
    description:
      "Guides for admins and authors: Studio overview, integrations, AI literacy, trust, and customer success playbooks (public excerpts only).",
    mode: "admin",
    reminder:
      "Deploy Studio from the sudar-studio folder, configure your database and Intelligence, then open the in-product Sudar Help Center for provisioning detail and operator-only articles.",
  },
};

function tabClass(active: boolean): string {
  return active
    ? "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium bg-white text-black"
    : "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-gray-400 border border-white/10 hover:text-white hover:border-white/20 transition-colors";
}

export function HelpHubShell({ activeTab }: { activeTab: HelpTab }) {
  const copy = TAB_COPY[activeTab];
  const groups = loadGroupedPublicMarketingMetas(copy.mode);

  return (
    <section className="help-hub-shell mx-auto w-full max-w-content-wide px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Sudar Help Center</p>
      <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
        {copy.title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground-muted sm:text-lg">{copy.description}</p>

      <nav
        className="mt-10 flex flex-wrap gap-2 border-b border-white/10 pb-6"
        aria-label="Help Center audience"
      >
        <Link href="/help/learn" className={tabClass(activeTab === "learn")}>
          For learners
        </Link>
        <Link href="/help/studio" className={tabClass(activeTab === "studio")}>
          For admins
        </Link>
      </nav>

      {groups.length === 0 ? (
        <p className="mt-8 rounded-xl border border-card-border bg-card-bg p-6 text-foreground-muted">
          No public articles are published yet. Add Markdown under{" "}
          <code className="rounded bg-background-muted px-1.5 py-0.5 text-sm text-foreground">help-center/articles</code>{" "}
          with <code className="rounded bg-background-muted px-1.5 py-0.5 text-sm text-foreground">marketing: true</code>.
        </p>
      ) : (
        <div className="mt-10">
          <HelpArticleGrid groups={groups} />
        </div>
      )}

      <div className="mt-12 rounded-xl border border-card-border bg-card-bg p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground">Quick reminder</h2>
        <p className="mt-2 text-foreground-muted leading-relaxed">{copy.reminder}</p>
      </div>

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {activeTab === "learn" ? (
          <Link href="/help/studio" className="help-hub-link text-primary font-medium hover:underline">
            Studio Help →
          </Link>
        ) : (
          <Link href="/help/learn" className="help-hub-link text-primary font-medium hover:underline">
            Learn Help →
          </Link>
        )}
        <Link href="/modalities" className="help-hub-link text-primary font-medium hover:underline">
          Modalities →
        </Link>
        <Link href="/faq" className="help-hub-link text-primary font-medium hover:underline">
          FAQ →
        </Link>
        <Link href="/self-host" className="help-hub-link text-primary font-medium hover:underline">
          Self-host →
        </Link>
      </div>
    </section>
  );
}

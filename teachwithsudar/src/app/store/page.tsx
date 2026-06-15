import Link from "next/link";
import { ProseSection } from "@/components/ProseSection";
import { StoreCatalog } from "@/components/store/StoreCatalog";
import { GITHUB_URL, STUDIO_APP_URL } from "@/lib/site-nav";

export const metadata = {
  title: "Sudar Store",
  description:
    "Download LMS plugins, Sudar Create tools, ALP connectors, and developer SDKs. Integrate adaptive tutoring and AI content generation with Moodle, Canvas, and any LTI LMS.",
};

export default function StorePage() {
  return (
    <>
      <ProseSection
        wide
        label="Integrations"
        title="Sudar Store"
        subtitle="Download packages, launch LTI tools, and connect APIs to add adaptive intelligence and AI content creation to your LMS — without replacing it."
      >
        <div className="not-prose mb-10 flex flex-wrap gap-3">
          <a
            href={STUDIO_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-xl bg-brand-orange px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90"
          >
            Get API key in Studio →
          </a>
          <Link
            href="/self-host"
            className="inline-flex items-center rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-white/5"
          >
            Self-host at $0
          </Link>
          <a
            href={`${GITHUB_URL}/blob/main/docs/SUDAR_CREATE_API.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-white/5"
          >
            Create API docs →
          </a>
        </div>

        <div className="not-prose mb-12 grid gap-4 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Deploy or use Sudar Cloud",
              body: "Run Learn + Studio or use hosted URLs. Create an org-scoped integration key in Studio → Integrations.",
            },
            {
              step: "2",
              title: "Pick a service",
              body: "Choose ALP intelligence (Memory, Chat, Recommend), Sudar Create (Quiz, Interact, Cards), or a Moodle/Canvas connector.",
            },
            {
              step: "3",
              title: "Install or call API",
              body: "Download the Moodle plugin, register LTI in Canvas, or POST to /api/alp/* from your LMS backend.",
            },
          ].map((item) => (
            <div key={item.step} className="glass-card rounded-2xl border border-white/10 p-5">
              <span className="font-subheading text-xs font-semibold text-brand-orange">Step {item.step}</span>
              <h2 className="mt-2 font-display text-lg font-semibold text-foreground">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </ProseSection>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <StoreCatalog />
      </section>
    </>
  );
}

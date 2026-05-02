import Link from "next/link";
import { ProseSection } from "@/components/ProseSection";
import { loadAllPublicMarketingMetas } from "@/lib/helpCenterPublic";

export const metadata = {
  title: "Sudar Studio Help",
};

export default function StudioHelpPage() {
  const articles = loadAllPublicMarketingMetas("admin");

  return (
    <ProseSection title="Sudar Studio Help">
      <p className="text-lg text-foreground">
        Sudar Studio is the authoring and governance surface: courses, analytics, integrations, AI keys, and Sudar Agents.
      </p>

      <p className="mt-6 text-foreground">
        Public articles below mirror the Markdown corpus in{" "}
        <code className="rounded bg-background-muted px-1.5 py-0.5 text-sm text-foreground">help-center/</code> with the{" "}
        <code className="rounded bg-background-muted px-1.5 py-0.5 text-sm text-foreground">marketing:&nbsp;true</code> flag.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">Guides</h2>
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

      <h2 className="mt-10 text-xl font-semibold text-foreground">Shipping your own Sudar tenant</h2>
      <p className="mt-2 text-foreground">
        From the repo <code className="text-sm">sudar-studio</code>: <code className="text-sm">npm install</code>,{" "}
        <code className="text-sm">npm run dev</code>. Configure Supabase, auth, Intelligence URL, Learn base URL (
        <code>NEXT_PUBLIC_LEARN_APP_URL</code>
        ).
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">Integrations checklist</h2>
      <p className="mt-2 text-foreground">
        Plan identity, LMS/LTI connectors, telemetry, Sudar Agents enablement, and AI governance before onboarding your
        first cohort—the same framework described in-repo under <code>docs/INTEGRATION_GUIDE.md</code>.
      </p>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/help/learn" className="text-accent hover:underline">
          Learn Help →
        </Link>
        <Link href="/alp" className="text-accent hover:underline">
          ALP & Plugins →
        </Link>
        <Link href="/faq" className="text-accent hover:underline">
          FAQ →
        </Link>
      </div>
    </ProseSection>
  );
}

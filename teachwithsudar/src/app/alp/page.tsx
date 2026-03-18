import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";
import { GITHUB_URL } from "@/lib/site-nav";

export const metadata = {
  title: "ALP & Plugins",
};

export default function ALPPage() {
  return (
    <ProseSection title="ALP & Plugins">
      <p className="text-lg text-foreground">
        The <strong className="text-foreground">Adaptive Learning Layer (ALP)</strong> lets you add Sudar&apos;s
        capabilities to an existing LMS as plugins. Your Moodle or Canvas gains adaptive, memory-aware tutoring
        without replacing the whole system.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">How ALP works</h2>
      <p className="mt-2 text-foreground">
        ALP sits between your host LMS (Moodle, Canvas, Blackboard) and Sudar Intelligence. The LMS sends events
        (completions, quiz attempts, time-on-task, tutor exchanges). ALP keeps a learner profile and calls
        Intelligence for tutor Q&A, next-best-action, and modality recommendations. SCORM and xAPI events map into
        Sudar&apos;s learning_events and learner_profiles.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">ALP plugins (Moodle connector)</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground">
        <li>
          <strong className="text-foreground">SudarMemory</strong>: Sends learning events from the LMS to{" "}
          <code>POST /api/alp/events</code> on your Sudar Learn app.
        </li>
        <li>
          <strong className="text-foreground">SudarChat</strong>: Tutor inside Moodle. A block or LTI that embeds
          Sudar chat and calls <code>POST /api/alp/tutor/query</code> with learner ID and course context.
        </li>
        <li>
          <strong className="text-foreground">SudarRecommend</strong>: Next-action block on the Moodle dashboard.
          Calls <code>POST /api/alp/next-action</code> and shows the recommendation card.
        </li>
      </ul>
      <p className="mt-4 text-foreground">
        Auth for all ALP endpoints uses <code>x-alp-api-key</code> or <code>Authorization: Bearer</code> with an
        API key you create in Sudar Studio → Integrations.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">API documentation</h2>
      <p className="mt-2 text-foreground">
        The full ALP API (event ingestion, learner profile, next-action, tutor query, embed token) is in{" "}
        <code>docs/ALP_API.md</code> in the repo. Studio&apos;s Integrations page has your Learn base URL, API key
        setup, and embed link generator.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/plugins" className="text-accent hover:underline">
          Plugin downloads →
        </Link>
        <a href={`${GITHUB_URL}/blob/main/docs/ALP_API.md`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          ALP API (GitHub) →
        </a>
        <Link href="/help/studio" className="text-accent hover:underline">
          Studio Help (Integrations) →
        </Link>
      </div>
    </ProseSection>
  );
}

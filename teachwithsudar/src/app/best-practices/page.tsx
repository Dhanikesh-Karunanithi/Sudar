import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";

export const metadata = {
  title: "Best Practices & Tips",
};

export default function BestPracticesPage() {
  return (
    <ProseSection title="Best Practices & Tips">
      <p className="text-lg text-foreground">
        Tips for getting the most out of Sudar Studio and Learn — course design, path setup, ALP integration, and
        compliance.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Course design</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground">
        <li>Use a clear document or URL as source; the AI generates better structure when the input is well-organized.</li>
        <li>Review and edit generated modules before publishing; add media (images, video) from the media search to reinforce key points.</li>
        <li>Use quizzes to reinforce learning and feed struggle detection into the learner model.</li>
      </ul>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Learning paths</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground">
        <li>Set mandatory vs. optional courses; Sudar can reorder optional courses adaptively per learner.</li>
        <li>Use due dates for compliance paths; enable compliance email reminders (cron) so at-risk learners get a nudge.</li>
      </ul>
      <h2 className="mt-10 text-xl font-semibold text-foreground">ALP integration</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground">
        <li>Create an API key in Studio → Integrations; use it for all ALP endpoints (events, tutor, next-action).</li>
        <li>Map LMS user IDs to Sudar <code>profiles.id</code> consistently (e.g. LTI <code>user_id</code> or SSO subject).</li>
        <li>Send events in batches at end of session or on a schedule to avoid overwhelming the API.</li>
      </ul>
      <h2 className="mt-10 text-xl font-semibold text-foreground">RAG & tutor quality</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground">
        <li>Publish courses so content is chunked and embedded; the tutor RAG uses <code>content_chunks</code> in Supabase.</li>
        <li>Learners can use “Explain this” on selected text for contextual help; encourage them to ask follow-ups so the tutor memory builds.</li>
      </ul>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/help/studio" className="text-accent hover:underline">
          Studio Help →
        </Link>
        <Link href="/help/learn" className="text-accent hover:underline">
          Learn Help →
        </Link>
        <Link href="/alp" className="text-accent hover:underline">
          ALP & Plugins →
        </Link>
      </div>
    </ProseSection>
  );
}

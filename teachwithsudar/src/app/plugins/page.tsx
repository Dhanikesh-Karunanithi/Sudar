import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";
import { GITHUB_URL } from "@/lib/site-nav";

export const metadata = {
  title: "Plugin Downloads",
};

export default function PluginsPage() {
  return (
    <ProseSection title="Plugin Downloads">
      <p className="text-lg text-foreground">
        ALP (Adaptive Learning Layer) plugins let you add Sudar&apos;s adaptive tutoring and memory to existing LMSs.
        The API is implemented in the Sudar Learn app; connectors (e.g. Moodle) call it with an API key.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">ALP API documentation</h2>
      <p className="mt-2 text-foreground">
        The full API — event ingestion, tutor query, next-action, embed token — is documented in the repository:
      </p>
      <a
        href={`${GITHUB_URL}/blob/main/docs/ALP_API.md`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-accent hover:underline"
      >
        docs/ALP_API.md on GitHub →
      </a>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Moodle connector</h2>
      <p className="mt-2 text-foreground">
        Three ALP components are implemented for Moodle (or any LMS that can send HTTP requests):
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground">
        <li><strong className="text-foreground">SudarMemory</strong> — Sends LMS events to <code>POST /api/alp/events</code> on your Sudar Learn app.</li>
        <li><strong className="text-foreground">SudarChat</strong> — Block or LTI that embeds the tutor and calls <code>POST /api/alp/tutor/query</code>.</li>
        <li><strong className="text-foreground">SudarRecommend</strong> — Dashboard block that calls <code>POST /api/alp/next-action</code> and shows the recommendation.</li>
      </ul>
      <p className="mt-4 text-foreground">
        Plugin packages (e.g. Moodle block ZIP) will be published via <strong>GitHub Releases</strong> when ready.
        Until then, implementors can use the API spec and the Learn app as the backend; user mapping (LMS user ID →
        Sudar <code>profiles.id</code>) is documented in <code>docs/PILOT_PLAN.md</code> and <code>docs/ALP_API.md</code>.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Embed Sudar in your site</h2>
      <p className="mt-2 text-foreground">
        From Sudar Studio → Integrations → Embed Sudar, you can generate an embed link. The embed token endpoint is{" "}
        <code>POST /api/alp/embed-token</code> on the Learn app (see ALP_API.md). Use the returned <code>embed_url</code> as
        the <code>src</code> of an iframe.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/alp" className="text-accent hover:underline">
          ALP & Plugins overview →
        </Link>
        <Link href="/help/studio" className="text-accent hover:underline">
          Studio Help (Integrations) →
        </Link>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          GitHub →
        </a>
      </div>
    </ProseSection>
  );
}

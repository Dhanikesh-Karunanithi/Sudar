import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";

export const metadata = {
  title: "Studio Help",
};

export default function StudioHelpPage() {
  return (
    <ProseSection title="Sudar Studio Help">
      <p className="text-lg text-foreground">
        Sudar Studio is the admin and creator app: build courses, manage learning paths, and connect external systems
        via Integrations.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Getting started</h2>
      <p className="mt-2 text-foreground">
        From the <code>byteos-studio</code> folder: <code>npm install</code> then <code>npm run dev</code>. Open
        http://localhost:3000 and sign in. Set environment variables from <code>.env.example</code> (Supabase,
        <code>NEXT_PUBLIC_LEARN_APP_URL</code> for Integrations).
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Navigation</h2>
      <ul className="mt-4 list-disc space-y-1 pl-6 text-foreground">
        <li><strong className="text-foreground">Dashboard</strong> — Overview, quick access to courses and paths.</li>
        <li><strong className="text-foreground">Courses</strong> — Create, edit, publish. Generate from document, URL, or prompt.</li>
        <li><strong className="text-foreground">Learning Paths</strong> — Build ordered sequences; assign to learners; set mandatory/optional and due dates.</li>
        <li><strong className="text-foreground">Analytics</strong> — Completions, skill gaps, drop-off.</li>
        <li><strong className="text-foreground">Compliance</strong> — Overdue, at-risk, on-track.</li>
        <li><strong className="text-foreground">Users</strong> — Manage org members and roles.</li>
        <li><strong className="text-foreground">Integrations</strong> — API keys, embed Sudar, event ingestion (ALP).</li>
      </ul>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Creating your first course</h2>
      <p className="mt-2 text-foreground">
        Go to Courses → New course. You can upload a PDF/DOCX, paste a URL, or enter a topic. The AI generates an
        outline and modules; edit as needed, add media from the media search, then Publish. The course appears in
        Learn for enrolled learners.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Integrations & API keys</h2>
      <p className="mt-2 text-foreground">
        Under Organization → Integrations you create API keys for external LMSs. Use the key as{" "}
        <code>x-alp-api-key</code> or <code>Authorization: Bearer</code> when calling ALP endpoints on your Learn
        app (event ingestion, tutor query, next-action). You can also generate an embed link to show the Sudar chat
        in an iframe on another site.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Event ingestion</h2>
      <p className="mt-2 text-foreground">
        To send learning events from your LMS into Sudar (SudarMemory), implement <code>POST …/api/alp/events</code> on
        the Learn app. Request body: <code>user_id</code> (Sudar UUID) and <code>events</code> array. Full spec: ALP
        API documentation in the repo.
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

import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";

export const metadata = {
  title: "Updates & Changelog",
};

const updates = [
  { date: "2026-03", title: "Compliance email reminders", body: "Studio cron endpoint for at-risk and overdue path assignments; Resend integration." },
  { date: "2026-03", title: "SCORM 1.2 import", body: "Upload SCORM ZIP in Studio; parse imsmanifest.xml; map to courses/modules; delivery in Learn via iframe proxy." },
  { date: "2026-03", title: "Document-to-course & RAG", body: "Generate course from PDF/DOCX/URL; RAG pipeline for context-aware generation." },
  { date: "2026-03", title: "Floating Sudar Chat & memory", body: "Global tutor chat, structured responses (enroll/continue/review), outcome logging, My Memory page, memory insights." },
  { date: "2026-03", title: "Listen (Audio TTS) modality", body: "Listen tab in Learn; on-demand TTS via Intelligence (Edge-TTS); voice/rate configurable." },
  { date: "2026-03", title: "Flashcards modality", body: "Cards tab per module; AI-generated flashcards from content." },
  { date: "2026-03", title: "ALP API & Moodle connector", body: "Event ingestion, tutor/next-action endpoints, SudarMemory, SudarChat, SudarRecommend; docs/ALP_API.md." },
  { date: "2026-02", title: "Production deployment docs", body: "VERCEL_DEPLOYMENT.md, INTELLIGENCE_DEPLOYMENT.md (Railway, Render, Fly.io)." },
];

export default function UpdatesPage() {
  return (
    <ProseSection title="Updates & Changelog">
      <p className="text-lg text-foreground">
        Product updates and release notes. For the full list of shipped features, see the repo{" "}
        <code>docs/SHIPPED_FEATURES.md</code>.
      </p>
      <ul className="mt-10 space-y-4">
        {updates.map((u, i) => (
          <li key={i} className="rounded-xl border border-card-border bg-card-bg p-5 shadow-card">
            <span className="text-slate-400">{u.date}</span>
            <h3 className="mt-1 font-semibold text-foreground">{u.title}</h3>
            <p className="mt-2 text-foreground">{u.body}</p>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/blog" className="text-accent hover:underline">
          Blog →
        </Link>
        <Link href="/roadmap" className="text-accent hover:underline">
          Roadmap →
        </Link>
      </div>
    </ProseSection>
  );
}

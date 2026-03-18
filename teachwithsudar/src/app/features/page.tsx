import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";
import Image from "next/image";
import { STUDIO_APP_URL, LEARN_APP_URL } from "@/lib/site-nav";

export const metadata = {
  title: "Features",
};

export default function FeaturesPage() {
  return (
    <ProseSection title="Features">
      <p className="text-lg text-foreground">
        One stack for authoring (Studio), delivery (Learn), and adaptive intelligence. Here is what each part does.
      </p>
      <div className="mt-6 flex flex-wrap gap-4">
        <a
          href={STUDIO_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Try Sudar Studio →
        </a>
        <a
          href={LEARN_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-lg border border-border bg-card-bg px-4 py-2 text-sm font-medium text-foreground hover:bg-background-muted"
        >
          Try Sudar Learn →
        </a>
      </div>
      <h2 className="mt-10 text-xl font-semibold text-foreground">See it in action</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <a href={STUDIO_APP_URL} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-card-border bg-card-bg">
          <div className="relative aspect-video w-full">
            <Image src="/screenshots/studio-login.png" alt="Sudar Studio login" fill className="object-cover" />
          </div>
          <p className="p-3 text-sm text-foreground-muted">Sudar Studio · Admin & Creator</p>
        </a>
        <a href={LEARN_APP_URL} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-card-border bg-card-bg">
          <div className="relative aspect-video w-full">
            <Image src="/screenshots/learn-login.png" alt="Sudar Learn login" fill className="object-cover" />
          </div>
          <p className="p-3 text-sm text-foreground-muted">Sudar Learn · Learner experience</p>
        </a>
      </div>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Sudar Studio (Admin / Creator)</h2>
      <ul className="mt-4 list-disc space-y-1 pl-6 text-foreground">
        <li>AI-powered course generation from PDF, DOCX, URL, or text prompt</li>
        <li>RAG pipeline for context-aware generation from uploaded documents</li>
        <li>14 visual course templates, block-based editing, live preview</li>
        <li>Multi-source media search (Google, Pexels, Unsplash, Giphy)</li>
        <li>Web-search–driven module generation with citations</li>
        <li>SCORM 1.2 export and import</li>
        <li>Content fact-checking and validation</li>
        <li>Learning path builder (assign ordered course sequences to teams)</li>
        <li>Analytics dashboard (completions, skill gaps, drop-off analysis)</li>
        <li>Role-based access (Admin, Manager, Creator, Learner)</li>
        <li>Compliance tracking (mandatory training, certifications, due dates)</li>
        <li>Compliance email reminders (at-risk and overdue)</li>
        <li>Integrations: ALP API keys, embed Sudar, event ingestion</li>
      </ul>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Sudar Learn (Learner)</h2>
      <ul className="mt-4 list-disc space-y-1 pl-6 text-foreground">
        <li>Personalized learner dashboard (streak, time, engagement, Sudar recommends)</li>
        <li>Modality switching: Text, Video, Audio (Listen), MindMap, Flashcards, SudarFeed, SudarPlay</li>
        <li>AI Tutor Sudar: RAG over course content, longitudinal memory, floating chat</li>
        <li>Structured tutor responses (enroll, continue, review), quick memory preferences</li>
        <li>My Memory page with insights carousel</li>
        <li>Skills graph and knowledge gap visualization</li>
        <li>Next Best Action recommendations</li>
        <li>Learning path enrollment and progress tracking</li>
        <li>Certification management, SCORM delivery (iframe proxy)</li>
        <li>Digital Learner Twin (accumulation of all signals about a learner)</li>
        <li>Change password flow when required by admin</li>
      </ul>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Sudar Intelligence</h2>
      <ul className="mt-4 list-disc space-y-1 pl-6 text-foreground">
        <li>Adaptive difficulty engine</li>
        <li>Modality dispatcher and next-best-action algorithm</li>
        <li>AI Tutor engine (RAG, longitudinal memory via Supabase)</li>
        <li>Content generation (multi-format, multi-provider with fallback)</li>
        <li>Learner profile scoring and skill gap mapping</li>
        <li>Event processing (ingests learner events, updates profiles)</li>
        <li>Listen modality: TTS (Edge-TTS, optional Sarvam AI)</li>
      </ul>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/modalities" className="text-accent hover:underline">
          Modalities →
        </Link>
        <Link href="/alp" className="text-accent hover:underline">
          ALP & Plugins →
        </Link>
        <Link href="/self-host" className="text-accent hover:underline">
          Self-host →
        </Link>
      </div>
    </ProseSection>
  );
}

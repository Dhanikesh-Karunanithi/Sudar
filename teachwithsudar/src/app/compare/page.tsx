import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";

export const metadata = {
  title: "Compare",
};

export default function ComparePage() {
  return (
    <ProseSection title="Sudar vs. Alternatives">
      <p className="text-lg text-foreground">
        How Sudar compares to traditional authoring tools, typical LMSs, and generic AI for L&D.
      </p>
      <div className="mt-10 space-y-6">
        <div className="rounded-xl border border-card-border bg-card-bg shadow-card p-6">
          <h3 className="font-semibold text-accent">vs. Rise360 / Articulate Storyline / Adobe Captivate</h3>
          <p className="mt-2 text-foreground">
            Those tools need instructional designers, weeks of work, and high licence fees. With Sudar you generate
            a course from a document or URL in minutes, then edit and publish. No instructional designer required.
            Cost: self-host at $0 or pay only for Supabase and AI usage, a fraction of enterprise authoring
            subscriptions.
          </p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg shadow-card p-6">
          <h3 className="font-semibold text-accent">vs. Generic LMS (Moodle, Cornerstone, Docebo)</h3>
          <p className="mt-2 text-foreground">
            Typical LMSs track completions and serve the same content to everyone. They do not keep a longitudinal
            learner model. Sudar keeps a persistent profile and uses it for adaptive path ordering, next-best-action,
            and an AI tutor with memory. You can also add Sudar to your existing LMS via the ALP so Moodle or Canvas
            gets adaptive, memory-aware tutoring without full replacement.
          </p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg shadow-card p-6">
          <h3 className="font-semibold text-accent">vs. ChatGPT (or generic AI) for L&D</h3>
          <p className="mt-2 text-foreground">
            ChatGPT generates text. Sudar generates courses, videos, audio, flashcards, mindmaps, and a personal
            tutor that remembers your learners across sessions. The tutor uses RAG over your course content and a
            persistent learner profile so responses are personalized. It is built into the learning experience, not
            a separate chat.
          </p>
        </div>
      </div>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/features" className="text-accent hover:underline">
          Features →
        </Link>
        <Link href="/self-host" className="text-accent hover:underline">
          Self-host at $0 →
        </Link>
      </div>
    </ProseSection>
  );
}

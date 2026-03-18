import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";

export const metadata = {
  title: "Learn Help",
};

export default function LearnHelpPage() {
  return (
    <ProseSection title="Sudar Learn Help">
      <p className="text-lg text-foreground">
        Sudar Learn is the learner-facing app: dashboard, courses, modalities, and the AI tutor Sudar.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Dashboard</h2>
      <p className="mt-2 text-foreground">
        After signing in you see your personalized dashboard: streak, time spent, engagement summary, and Sudar
        recommends (next best action). Enrolled learning paths and courses are listed; click to continue or start.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Taking a course</h2>
      <p className="mt-2 text-foreground">
        Open a course to see modules. Each module can be viewed in multiple modalities: Read (text), Listen (audio
        TTS), Watch (video when available), Map (mindmap), Cards (flashcards). Switch tabs to choose. Progress and
        completion rules (e.g. minimum time) apply across modalities.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Sudar the tutor</h2>
      <p className="mt-2 text-foreground">
        Use the floating Sudar chat (global) to ask questions. Sudar has RAG over your course content and
        longitudinal memory: it remembers your goals, struggles, and preferences. You can select text and ask
        &quot;Explain this&quot; for contextual help. Responses can suggest enrolling in a course, continuing a
        module, or reviewing material. Use My Memory to see what Sudar knows about you and adjust preferences (e.g.
        response length).
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Learning paths & certificates</h2>
      <p className="mt-2 text-foreground">
        If you’re assigned to a path, complete courses in order (mandatory first; optional can be reordered by Sudar
        if adaptive mode is on). When you complete a path you may receive a certificate; certificates can be
        shared or verified via the platform.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">SCORM courses</h2>
      <p className="mt-2 text-foreground">
        Some modules are delivered as SCORM packages. They open in an iframe; progress and score are reported back
        to Sudar so your profile stays up to date.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/help/studio" className="text-accent hover:underline">
          Studio Help →
        </Link>
        <Link href="/modalities" className="text-accent hover:underline">
          Modalities →
        </Link>
        <Link href="/faq" className="text-accent hover:underline">
          FAQ →
        </Link>
      </div>
    </ProseSection>
  );
}

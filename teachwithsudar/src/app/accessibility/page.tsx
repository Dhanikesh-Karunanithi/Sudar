import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";

export const metadata = {
  title: "Accessibility",
};

export default function AccessibilityPage() {
  return (
    <ProseSection title="Accessibility">
      <p className="text-lg text-slate-300">
        Sudar is committed to making learning accessible. Our design and roadmap align with that goal.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Multimodal delivery</h2>
      <p className="mt-2 text-slate-300">
        Content is available in multiple modalities — text (Read), Listen (audio TTS), Video, Flashcards,
        MindMap — so learners can choose the format that works for them. Dual coding and multimodal presentation
        support different learning preferences and assistive needs.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Structure and semantics</h2>
      <p className="mt-2 text-slate-300">
        Course content is structured (headings, sections, lists) so that screen readers and assistive technology
        can navigate meaningfully. The learner dashboard and course viewer use semantic markup where applicable.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Keyboard navigation</h2>
      <p className="mt-2 text-slate-300">
        Full keyboard navigation across the platform is on the roadmap. Interactive elements in Learn and Studio
        are focusable; we are working to ensure all flows can be completed without a mouse.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Ongoing work</h2>
      <p className="mt-2 text-slate-300">
        We welcome feedback on accessibility. If you encounter barriers when using Sudar or this website, please
        contact us so we can prioritise improvements. Our research foundation (RESEARCH_FOUNDATION.md) lists
        accessibility as an alignment theme: multimodal delivery and structure that supports assistive tech.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/contact" className="text-accent hover:underline">
          Contact →
        </Link>
        <Link href="/research" className="text-accent hover:underline">
          Research Foundation →
        </Link>
      </div>
    </ProseSection>
  );
}

import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";

export const metadata = {
  title: "Research Foundation",
};

const citations = [
  {
    era: "Foundation",
    theory: "Forgetting Curve",
    author: "Hermann Ebbinghaus",
    year: "1885",
    journal: "Über das Gedächtnis",
    sudar: "Spaced repetition in Flashcards & Adaptive Sequencing",
  },
  {
    era: "Foundation",
    theory: "Multimedia Learning",
    author: "Richard E. Mayer",
    year: "2009",
    journal: "Multimedia Learning, 2nd ed.",
    sudar: "Seven adaptive modalities per course",
  },
  {
    era: "Modern validation",
    theory: "Testing Effect",
    author: "Roediger & Karpicke",
    year: "2006",
    journal: "Psychological Science, 17(3)",
    sudar: "In-module quizzes, flashcards, and struggle signals in the Digital Learner Twin",
  },
  {
    era: "Modern validation",
    theory: "Intelligent Tutoring Systems",
    author: "Kurt VanLehn",
    year: "2011",
    journal: "Educational Psychologist, 46(4)",
    sudar: "Adaptive sequencing, Next Best Action, and the AI tutor sidebar",
  },
  {
    era: "AI era",
    theory: "AI-Augmented Textbooks",
    author: "LearnLM Team (Google)",
    year: "2025",
    journal: "arXiv:2509.13348",
    sudar: "Author once, deliver in text, video, audio, mind map, flashcards, and more",
  },
  {
    era: "AI era",
    theory: "Memory-Aware AI Tutoring",
    author: "Liu et al. (AgentTutor)",
    year: "2026",
    journal: "arXiv:2601.04219",
    sudar: "Cross-session tutor memory in ai_tutor_context and consent-governed learner model updates",
  },
] as const;

export default function ResearchPage() {
  return (
    <ProseSection title="Research Foundation">
      <p className="text-lg text-foreground">
        Sudar is built on established findings from learning science, cognitive science, and adaptive learning research
        — from replicated classics to 2020s AI tutoring trials — with each principle mapped to a shipped feature.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">The gap Sudar fills</h2>
      <p className="mt-2 text-foreground">
        Most LMSs serve static content: one course for all, no memory of the learner, no adaptation of sequence or
        difficulty. Research shows that adaptive instruction and intelligent tutoring outperform one-size-fits-all
        delivery. Mainstream products still lack a longitudinal learner model and memory-aware tutoring. Sudar provides
        learner memory, adaptive sequencing, and AI tutoring in a single open platform.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Evidence mapped to Sudar</h2>
      <p className="mt-2 text-foreground">
        The homepage research cards use three tiers: durable foundations, modern meta-analyses and replication studies,
        and recent AI-era work on personalised multimodal delivery and memory-aware tutoring.
      </p>
      <ul className="mt-6 space-y-5">
        {citations.map((c) => (
          <li
            key={`${c.author}-${c.year}`}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
          >
            <p className="text-xs font-mono uppercase tracking-wide text-slate-500">
              {c.era} · {c.year}
            </p>
            <p className="mt-2 font-semibold text-foreground">{c.theory}</p>
            <p className="mt-1 text-sm text-slate-400">
              {c.author} · {c.journal}
            </p>
            <p className="mt-3 text-sm text-foreground">
              <span className="text-accent">Sudar:</span> {c.sudar}
            </p>
          </li>
        ))}
      </ul>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Core principles (evidence base)</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground">
        <li>
          <strong className="text-foreground">Personalisation & adaptive instruction:</strong> Learner profiles,
          next-best-action, adaptive path ordering, personalised welcome messages.
        </li>
        <li>
          <strong className="text-foreground">Multimodal learning:</strong> Content authored once, delivered in text,
          video, audio, mindmaps, flashcards, and game-based modalities.
        </li>
        <li>
          <strong className="text-foreground">Metacognition & self-regulated learning:</strong> Progress visibility,
          Sudar recommends, upcoming deadlines, required-path surfacing.
        </li>
        <li>
          <strong className="text-foreground">Formative assessment & retrieval practice:</strong> In-module quizzes
          with immediate feedback, struggle detection feeding the learner model.
        </li>
        <li>
          <strong className="text-foreground">Intelligent tutoring & dialogue:</strong> Reactive Q&A (RAG over
          course content), longitudinal memory, contextual help, proactive nudges.
        </li>
        <li>
          <strong className="text-foreground">Longitudinal learner model (Digital Learner Twin):</strong> Persistent
          learner_profiles with ai_tutor_context, next_best_action, onboarding data.
        </li>
        <li>
          <strong className="text-foreground">Learning paths & prerequisite structure:</strong> Mandatory and
          optional courses, unlock rules, adaptive path ordering, certifications.
        </li>
        <li>
          <strong className="text-foreground">Organisational learning & compliance:</strong> Assignments, due dates,
          compliance views, certificates with shareable verification.
        </li>
      </ul>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Sudar / LAMP paper (2026)</h2>
      <p className="mt-2 text-foreground">
        The reference platform, Adaptive Learning Layer (ALP) plugin architecture, and economic analysis are described
        in our primary paper. See{" "}
        <Link href="/papers" className="text-accent hover:underline">
          Research Papers
        </Link>{" "}
        for the abstract and citation.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Alignment with broader themes</h2>
      <p className="mt-2 text-foreground">
        Differentiation (adaptive paths, modality choice), scaffolding (Sudar as tutor), feedback (quizzes, progress,
        next-best-action), motivation (streaks, certificates), and accessibility (multimodal delivery, structure for
        assistive tech).
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Open science and reproducibility</h2>
      <p className="mt-2 text-foreground">
        Sudar is open source. Researchers and practitioners can inspect, extend, and evaluate the implementation.
        Schema and event model are documented; learning_events and ai_interactions support research on engagement and
        tutor usage. We encourage citing the repository and this foundation when Sudar is used in studies or
        derivative work.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/papers" className="text-accent hover:underline">
          Research Papers →
        </Link>
        <Link href="/mission" className="text-accent hover:underline">
          Mission & Vision →
        </Link>
      </div>
    </ProseSection>
  );
}

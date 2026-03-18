import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";

export const metadata = {
  title: "Research Papers",
};

const PAPER_TITLE =
  "Learning That Remembers You: An AI-Native Ecosystem for Adaptive, Memory-Aware, and Multimodal Education at Scale";
const PAPER_ABSTRACT = `Traditional learning management systems (LMSs) deliver static, one-size-fits-all content with no longitudinal learner model and no adaptive tutoring. Intelligent tutoring systems (ITS) that do adapt remain either narrow-domain research prototypes or products disconnected from the course-hosting infrastructure most organisations already use. We present Sudar, an AI-native learning system with three main contributions: (1) a full open-source reference platform that unifies authoring, delivery, and intelligence around a persistent Digital Learner Twin, adaptive sequencing, a complete multimodal delivery stack (text with read-along TTS, video, audio podcast, mindmap, flashcards, and SCORM), and an AI tutor with longitudinal cross-session memory; (2) the Adaptive Learning Layer (ALP), an architecture by which these capabilities can be deployed as standalone plugins on top of existing LMSs; and (3) a demonstrated radical cost efficiency enabled by open-weight inference models and zero-cost TTS, making world-class AI-native learning economically viable at a per-learner infrastructure cost of less than $0.02 per month. The reference implementation is open source under the MIT licence, evidence-informed by the learning sciences.`;

export default function PapersPage() {
  return (
    <ProseSection title="Academy Research Papers">
      <p className="text-lg text-foreground">
        Sudar and the Adaptive Learning Layer (ALP) are described in academic work. Below is the primary paper and
        how to cite it.
      </p>
      <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-foreground">{PAPER_TITLE}</h2>
        <p className="mt-2 text-sm text-slate-400">Dhanikesh Karunanithi · Sudar / ALP Project · 2026</p>
        <p className="mt-4 text-foreground">{PAPER_ABSTRACT}</p>
        <div className="mt-6 flex flex-wrap gap-4">
          <a
            href="https://github.com/Dhanikesh-Karunanithi/Sudar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Repository (GitHub)
          </a>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">
            arXiv / PDF link when submitted (see repo docs/research for LaTeX and draft)
          </span>
        </div>
        <div className="mt-6 rounded-lg bg-background-muted p-4 font-mono text-sm text-foreground-muted">
          <p className="text-slate-500">BibTeX citation:</p>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words">
            {`@misc{sudar2026,
  author = {Karunanithi, Dhanikesh},
  title  = {Sudar: An {AI}-Native Learning {OS} and Adaptive Learning Layer},
  year   = {2026},
  url    = {https://github.com/Dhanikesh-Karunanithi/Sudar},
  note   = {Reference implementation, Apache-2.0 licence}
}`}
          </pre>
        </div>
      </div>
      <p className="mt-8 text-slate-400">
        The full LaTeX source and Markdown draft live in the repository under <code>docs/research/</code> and{" "}
        <code>docs/LAMP-Updated-Draft.md</code>. When the paper is submitted to arXiv, the link will be added here and
        in the repo.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/research" className="text-accent hover:underline">
          Research Foundation →
        </Link>
        <Link href="/collaborate" className="text-accent hover:underline">
          Call for collaboration →
        </Link>
      </div>
    </ProseSection>
  );
}

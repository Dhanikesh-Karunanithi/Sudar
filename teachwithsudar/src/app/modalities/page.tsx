import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";

export const metadata = {
  title: "Modalities",
  description: "Read, Listen, Watch, Map, Cards, SCORM, and roadmap modalities in Sudar Learn.",
};

const modalities = [
  {
    name: "Text (Read)",
    status: "Shipped",
    desc: "Markdown sections, summaries, and optional read-along. Default for every module.",
  },
  {
    name: "Listen (Audio TTS)",
    status: "Shipped",
    desc: "On-demand narration via Intelligence (Edge-TTS or Sarvam). Voice and rate follow learner prefs.",
  },
  {
    name: "Watch (Video)",
    status: "Shipped",
    desc: "In-browser animated video and SudarVid-generated decks from module content.",
  },
  {
    name: "Podcast",
    status: "Shipped",
    desc: "Dialogue-style audio; pre-generated or generated on demand.",
  },
  {
    name: "Flashcards (Cards)",
    status: "Shipped",
    desc: "AI-generated cards from module text; spaced repetition friendly study flow.",
  },
  {
    name: "MindMap (SudarMind)",
    status: "Shipped",
    desc: "Visual structure of concepts inside the course viewer.",
  },
  {
    name: "SCORM 1.2",
    status: "Shipped",
    desc: "Import packages in Studio; Learn launches via iframe proxy with correct MIME types.",
  },
  {
    name: "SudarFeed",
    status: "Roadmap",
    desc: "Short vertical clips in a scrollable feed for microlearning.",
  },
  {
    name: "SudarPlay",
    status: "Roadmap",
    desc: "Scenario-based games for applied practice (Phaser.js).",
  },
];

export default function ModalitiesPage() {
  return (
    <ProseSection title="Modalities" wide>
      <p className="text-lg text-foreground max-w-3xl">
        Author once in Studio. Learners choose how to consume each module in Learn. Intelligence
        and the Digital Learner Twin can recommend formats based on engagement signals.
      </p>

      <div className="mt-10 space-y-4">
        {modalities.map((m) => (
          <div key={m.name} className="rounded-xl border border-card-border bg-card-bg p-5 shadow-card flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground">{m.name}</h3>
              <p className="mt-2 text-foreground-muted">{m.desc}</p>
            </div>
            <span
              className={`text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full border ${
                m.status === "Shipped"
                  ? "border-emerald-500/30 text-emerald-400/90 bg-emerald-500/10"
                  : "border-amber-500/30 text-amber-400/90 bg-amber-500/10"
              }`}
            >
              {m.status}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/guides/learner-modalities-and-tutor" className="text-primary hover:underline font-medium">
          Learner walkthrough →
        </Link>
        <Link href="/help/article/learners/modalities" className="text-primary hover:underline font-medium">
          Help article →
        </Link>
        <Link href="/features" className="text-primary hover:underline font-medium">
          Features →
        </Link>
      </div>
    </ProseSection>
  );
}

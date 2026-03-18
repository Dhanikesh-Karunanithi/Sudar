import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";

export const metadata = {
  title: "Modalities",
};

const modalities = [
  {
    name: "Text (Read)",
    desc: "Standard reading view with markdown, sections, and optional read-along. Core modality for every module.",
  },
  {
    name: "Listen (Audio TTS)",
    desc: "Audiobook/podcast-style TTS. Generated on demand via Sudar Intelligence (Edge-TTS or Sarvam). Voice and rate configurable.",
  },
  {
    name: "Video",
    desc: "Pre-generated or on-demand video from module content. Powered by Remotion and bytetexttovid.",
  },
  {
    name: "Podcast",
    desc: "Audio dialogue format; can use pre-generated or on-demand content.",
  },
  {
    name: "Flashcards (Cards)",
    desc: "Cards generated from module content via AI. Learners study in Cards tab; completion rules apply.",
  },
  {
    name: "MindMap (SudarMind)",
    desc: "Mindmap modality embedded in Learn. Visual structure of module content.",
  },
  {
    name: "SCORM",
    desc: "Import SCORM 1.2 packages in Studio; delivery in Learn via iframe proxy with correct MIME types.",
  },
  {
    name: "SudarFeed",
    desc: "TikTok-style feed modality (absorbed from shayshay). Planned.",
  },
  {
    name: "SudarPlay",
    desc: "Game-based modality (Phaser.js). Planned / in progress.",
  },
];

export default function ModalitiesPage() {
  return (
    <ProseSection title="Modalities">
      <p className="text-lg text-foreground">
        Content is authored once in Studio and delivered in multiple formats in Learn. Learners choose the format
        that fits them: text, audio, video, flashcards, and more. Dual coding and multimodal research support
        offering these options.
      </p>
      <div className="mt-10 space-y-4">
        {modalities.map((m) => (
          <div key={m.name} className="rounded-xl border border-card-border bg-card-bg p-5 shadow-card">
            <h3 className="font-semibold text-accent">{m.name}</h3>
            <p className="mt-2 text-foreground">{m.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/features" className="text-accent hover:underline">
          Features →
        </Link>
        <Link href="/research" className="text-accent hover:underline">
          Research Foundation →
        </Link>
      </div>
    </ProseSection>
  );
}

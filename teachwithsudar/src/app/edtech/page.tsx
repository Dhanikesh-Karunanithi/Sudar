import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";

export const metadata = {
  title: "EdTech & AI Updates",
};

export default function EdTechPage() {
  return (
    <ProseSection title="EdTech & AI Updates">
      <p className="text-lg text-foreground">
        Curated notes on EdTech and AI in education — research, tools, and trends that inform Sudar and the broader
        mission to make learning adaptive and accessible.
      </p>
      <div className="mt-10 space-y-6">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="font-semibold text-accent">Adaptive instruction & ITS</h3>
          <p className="mt-2 text-foreground">
            VanLehn (2011), Aleven et al. (2016), and others show that adaptive learning and intelligent tutoring
            outperform one-size-fits-all delivery. Mainstream LMSs still rarely offer longitudinal learner models or
            memory-aware tutoring; Sudar is built to close that gap.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="font-semibold text-accent">Multimodal & dual coding</h3>
          <p className="mt-2 text-foreground">
            Mayer, Clark & Mayer: offering content in multiple formats (text, audio, visual, interactive) supports
            different learners and deepens encoding. Sudar is modality-agnostic so learners can choose or be guided to
            the format that fits.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="font-semibold text-accent">Cost collapse in AI inference</h3>
          <p className="mt-2 text-foreground">
            Open-weight models and zero-cost TTS (e.g. Edge-TTS) make AI-native learning economically viable at
            pennies per learner per month — a radical reduction vs. traditional authoring tools and proprietary AI
            stacks. Sudar’s reference implementation demonstrates this.
          </p>
        </div>
      </div>
      <p className="mt-10 text-slate-500">
        More short posts and links will be added over time. Sign up for updates on the Contact page when newsletter
        is available.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/research" className="text-accent hover:underline">
          Research Foundation →
        </Link>
        <Link href="/contact" className="text-accent hover:underline">
          Contact / Newsletter →
        </Link>
      </div>
    </ProseSection>
  );
}

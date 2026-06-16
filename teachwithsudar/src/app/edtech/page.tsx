import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";

export const metadata = {
  title: "EdTech & AI Updates",
  description:
    "How learning science, LMS economics, and AI inference costs shape Sudar's product decisions.",
};

const LANDSCAPE = [
  {
    title: "The LMS plateau",
    body: "Most organisations still run Moodle, Canvas, or Blackboard as content hosts. Completion rates stay in the low teens. The gap is not missing PDFs—it is missing learner models, adaptive sequencing, and memory-aware tutoring at the point of delivery.",
    cite: "Class Central MOOC Report; Jordan (2015) on MOOC completion",
  },
  {
    title: "Intelligent tutoring at scale",
    body: "Meta-analyses show adaptive systems and ITS outperform static delivery when feedback is immediate and difficulty tracks prior knowledge. Commercial LMSs rarely persist a longitudinal profile or connect tutor memory across sessions—Sudar's Digital Learner Twin is built for that gap.",
    cite: "VanLehn (2011); Aleven et al. (2016)",
  },
  {
    title: "Multimodal encoding",
    body: "Dual-coding and modality effects are not gimmicks: offering read, listen, watch, map, and cards from one authored source lets learners encode the same concepts through different channels. Sudar authors once in Studio; Learn switches formats without re-authoring.",
    cite: "Mayer; Clark & Mayer",
  },
  {
    title: "Economics of AI-native delivery",
    body: "Open-weight models and zero-cost TTS (Edge-TTS) collapse per-learner AI cost to pennies per month in reference deployments—making personalised tutoring viable for teams that cannot fund proprietary AI stacks or $30k+ authoring suites.",
    cite: "Sudar cost worksheet (docs/research/COST_WORKSHEET.md)",
  },
  {
    title: "Integration without rip-and-replace",
    body: "ALP (Adaptive Learning Layer) lets Moodle and other LMSs add memory, tutor, and next-best-action via plugins and HTTP APIs. Institutions keep their LMS of record; Sudar supplies the intelligence layer.",
    cite: "docs/ALP_API.md; Moodle 4.5 AI subsystem alignment",
  },
  {
    title: "Governance before hype",
    body: "Generative overlays and tutor memory need consent, retention policy, and audit trails—not just model access. Sudar ships org governance surfaces, trust documentation, and learner-controlled memory cadence alongside features.",
    cite: "docs/trust; Studio Governance page",
  },
];

export default function EdTechPage() {
  return (
    <ProseSection title="EdTech & AI landscape" wide>
      <p className="text-lg text-foreground max-w-3xl">
        Sudar is not built from trend decks. These are the forces we track when deciding what to ship,
        what to defer, and how to talk honestly about adaptive learning.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {LANDSCAPE.map((section) => (
          <div
            key={section.title}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
          >
            <h3 className="font-semibold text-accent">{section.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground">{section.body}</p>
            <p className="mt-4 text-xs font-mono text-zinc-500">{section.cite}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-xl border border-primary/20 bg-primary/[0.04] p-6">
        <h3 className="text-lg font-semibold text-foreground">What we ship vs. what we research</h3>
        <p className="mt-3 text-sm text-foreground-muted leading-relaxed">
          Six learner modalities are live today (Read, Listen, Watch, Podcast, Map, Cards) plus SCORM
          delivery. SudarFeed and SudarPlay remain on the{" "}
          <Link href="/roadmap" className="text-primary hover:underline">
            roadmap
          </Link>
          . Research citations on{" "}
          <Link href="/research" className="text-primary hover:underline">
            Research Foundation
          </Link>{" "}
          map directly to shipped behaviour—not slide-only promises.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/research" className="text-accent hover:underline font-medium">
          Research Foundation →
        </Link>
        <Link href="/blog" className="text-accent hover:underline font-medium">
          Blog (evidence-based posts) →
        </Link>
        <Link href="/updates" className="text-accent hover:underline font-medium">
          Product updates →
        </Link>
        <Link href="/contact" className="text-accent hover:underline font-medium">
          Contact →
        </Link>
      </div>
    </ProseSection>
  );
}

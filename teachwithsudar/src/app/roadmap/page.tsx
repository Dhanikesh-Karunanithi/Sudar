import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";

export const metadata = {
  title: "Roadmap",
};

export default function RoadmapPage() {
  return (
    <ProseSection title="Roadmap">
      <p className="text-lg text-foreground">
        What&apos;s next for Sudar. This summary is aligned with <code>docs/STRATEGIC_PATH.md</code> and the
        ECOSYSTEM phase checklist.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Near-term</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground">
        <li>Sudar memory demo video (1–2 min) and 2–4 screenshots in docs/screenshots.</li>
        <li>Production deployment fully documented (Vercel + Railway/Render/Fly.io) — done; see Self-Host page.</li>
      </ul>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Modalities</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground">
        <li>Video modality: wire to bytetexttovid / Remotion.</li>
        <li>SudarPlay (game modality), SudarFeed (social feed), SudarMind (mindmap) — complete or wire into Learn.</li>
      </ul>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Scale & enterprise</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground">
        <li>White-label per organisation.</li>
        <li>SSO and HRIS integration hooks.</li>
      </ul>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Polish</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground">
        <li>Server-generated certificate PDF.</li>
        <li>Keyboard navigation and accessibility improvements (roadmap in RESEARCH_FOUNDATION).</li>
      </ul>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Pilot & community</h2>
      <p className="mt-2 text-foreground">
        Pilot evaluations with institutional and corporate partners; ALP connectors for Moodle (and later Canvas,
        Blackboard); community plugin ecosystem. See the Call for collaboration page.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/updates" className="text-accent hover:underline">
          Updates & Changelog →
        </Link>
        <Link href="/collaborate" className="text-accent hover:underline">
          Collaborate →
        </Link>
      </div>
    </ProseSection>
  );
}

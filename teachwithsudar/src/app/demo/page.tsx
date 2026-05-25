import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";

const ECOSYSTEM_DEMO_URL =
  process.env.NEXT_PUBLIC_ECOSYSTEM_DEMO_URL ?? "http://localhost:3003";

export const metadata = {
  title: "Demo",
};

export default function DemoPage() {
  return (
    <ProseSection title="See Sudar in Action">
      <p className="text-lg text-foreground">
        Watch the Sudar product launch: a cinematic wireframe story with animated typography, cursor clicks, and a
        full creator-to-learner narrative. Play and pause only, like a video.
      </p>

      <div className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-8">
        <h2 className="text-xl font-semibold text-foreground">Product launch demo</h2>
        <p className="mt-3 text-foreground-muted">
          ~5 minutes. Training is broken → meet Sudar → Sarah generates <strong className="text-foreground">Somehow I manage</strong> from an idea and business need (video, audio, accordions, flipcards) → cohort and individual personalization → Marcus pauses on video → Sudar asks about what&apos;s on screen → Twin, certification, integrations. Full screen, minimal controls.
        </p>
        <a
          href={ECOSYSTEM_DEMO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        >
          Watch launch demo →
        </a>
        <p className="mt-4 text-sm text-foreground-muted font-mono">
          Local dev: <code className="text-primary/80">npm run demo:ecosystem</code> (port 3003)
        </p>
        <p className="mt-2 text-sm text-foreground-muted">
          Step-by-step how-to tour (for guides): add <code className="text-primary/80">/interactive</code> to the demo URL.
        </p>
      </div>

      <h2 className="mt-12 text-xl font-semibold text-foreground">Recorded demo (1–2 minutes)</h2>
      <p className="mt-3 text-foreground-muted">
        You can screen-record the interactive tour for pitches, or capture live product footage. Link the video
        below when ready.
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground">
        <li>
          <strong className="text-foreground">Content generation:</strong> Idea, business need, and document, not PDF-only.
        </li>
        <li>
          <strong className="text-foreground">Contextual tutor:</strong> Sudar references the lesson on screen; learner types a reply.
        </li>
        <li>
          <strong className="text-foreground">My Memory:</strong> Twin cards, uncertainty tags, individual learning context.
        </li>
      </ul>
      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-slate-400">Demo video: (Add your link here once recorded.)</p>
        <p className="mt-2 text-sm text-slate-500">
          Record the ecosystem demo autoplay with OBS or Loom, or use live Studio/Learn. See{" "}
          <code>docs/demo.md</code> and <code>sudar-ecosystem-demo/README.md</code>.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/guides" className="text-accent hover:underline">
          Step-by-step guides →
        </Link>
        <Link href="/features" className="text-accent hover:underline">
          Features →
        </Link>
        <Link href="/research" className="text-accent hover:underline">
          Research →
        </Link>
      </div>
    </ProseSection>
  );
}

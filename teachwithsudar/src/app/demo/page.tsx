import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";
import {
  INTERACTIVE_DEMO_PATH,
  LAUNCH_DEMO_PATH,
  interactiveDemoHref,
} from "@/lib/demo-urls";

export const metadata = {
  title: "Demo",
  description:
    "Watch the Sudar product launch demo and step-by-step interactive tour on teachwithsudar.com.",
};

export default function DemoPage() {
  return (
    <ProseSection title="See Sudar in Action">
      <p className="text-lg text-foreground">
        Watch the Sudar product launch: a cinematic wireframe story with animated typography, cursor
        clicks, and a full creator-to-learner narrative. Play and pause only, like a video.
      </p>

      <div className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-foreground">Product launch demo</h2>
        <p className="mt-3 text-foreground-muted">
          ~5 minutes. Training is broken → meet Sudar → Sarah generates{" "}
          <strong className="text-foreground">Somehow I manage</strong> from an idea and business
          need (video, audio, accordions, flipcards) → cohort and individual personalization →
          Marcus pauses on video → Sudar asks about what&apos;s on screen → Twin, certification,
          integrations. Full screen, minimal controls.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={LAUNCH_DEMO_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
            Watch launch demo →
          </Link>
          <Link
            href={INTERACTIVE_DEMO_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-foreground hover:border-primary/40 transition-colors"
          >
            Interactive step-by-step tour
          </Link>
        </div>

        <p className="mt-4 text-sm text-foreground-muted">
          Opens on{" "}
          <Link href={LAUNCH_DEMO_PATH} className="text-accent hover:underline">
            teachwithsudar.com{LAUNCH_DEMO_PATH}
          </Link>
          . Best in full screen; use Space to play or pause.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-[#050505]">
        <iframe
          title="Sudar product launch demo"
          src={LAUNCH_DEMO_PATH}
          className="w-full border-0 bg-[#050505]"
          style={{ height: "min(72vh, 720px)" }}
          allow="autoplay"
        />
      </div>

      <h2 className="mt-12 text-xl font-semibold text-foreground">What you&apos;ll see</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground-muted">
        <li>
          <strong className="text-foreground">Content generation:</strong> Idea, business need, and
          document — not PDF-only.
        </li>
        <li>
          <strong className="text-foreground">Contextual tutor:</strong> Sudar references the lesson
          on screen; the learner types a reply.
        </li>
        <li>
          <strong className="text-foreground">My Memory:</strong> Twin cards, uncertainty tags,
          individual learning context.
        </li>
      </ul>

      <p className="mt-8 text-sm text-foreground-muted">
        Prefer the guided tour with chapters?{" "}
        <Link href={interactiveDemoHref()} className="text-accent hover:underline">
          Open the interactive walkthrough
        </Link>
        . For Studio and Learn in production, see{" "}
        <Link href="/self-host" className="text-accent hover:underline">
          Self-host
        </Link>{" "}
        or try{" "}
        <a
          href="https://studio.thesudar.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          Sudar Studio
        </a>
        .
      </p>

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

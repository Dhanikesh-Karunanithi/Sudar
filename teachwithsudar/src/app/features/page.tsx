import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";
import Image from "next/image";
import { CapabilityGrid } from "@/components/platform/CapabilityGrid";
import { STUDIO_APP_URL, LEARN_APP_URL, GITHUB_URL } from "@/lib/site-nav";

export const metadata = {
  title: "Features",
  description:
    "Sudar Studio, Learn, Intelligence, ALP, and MCP: full capability catalog aligned with the open-source repo.",
};

export default function FeaturesPage() {
  return (
    <ProseSection title="Platform capabilities" wide>
      <p className="text-lg text-foreground max-w-3xl">
        This page tracks what ships in the Sudar monorepo today. For narrative release notes see{" "}
        <Link href="/updates" className="text-primary hover:underline">
          Updates
        </Link>
        ; for step-by-step tours see{" "}
        <Link href="/guides" className="text-primary hover:underline">
          Guides
        </Link>
        .
      </p>

      <div className="mt-6 flex flex-wrap gap-4">
        <a
          href={STUDIO_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Open Sudar Studio →
        </a>
        <a
          href={LEARN_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-lg border border-border bg-card-bg px-4 py-2 text-sm font-medium text-foreground hover:bg-background-muted"
        >
          Open Sudar Learn →
        </a>
        <a
          href={`${GITHUB_URL}/blob/main/docs/SHIPPED_FEATURES.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-lg border border-border bg-card-bg px-4 py-2 text-sm font-medium text-foreground hover:bg-background-muted"
        >
          SHIPPED_FEATURES.md →
        </a>
      </div>

      <h2 className="mt-12 text-xl font-semibold text-foreground">Screenshots</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <a
          href={STUDIO_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl overflow-hidden border border-card-border bg-card-bg"
        >
          <div className="relative aspect-video w-full">
            <Image src="/screenshots/studio-login.png" alt="Sudar Studio login" fill className="object-cover" />
          </div>
          <p className="p-3 text-sm text-foreground-muted">Sudar Studio</p>
        </a>
        <a
          href={LEARN_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl overflow-hidden border border-card-border bg-card-bg"
        >
          <div className="relative aspect-video w-full">
            <Image src="/screenshots/learn-login.png" alt="Sudar Learn login" fill className="object-cover" />
          </div>
          <p className="p-3 text-sm text-foreground-muted">Sudar Learn</p>
        </a>
      </div>

      <div className="mt-14">
        <CapabilityGrid />
      </div>

      <div className="mt-14 rounded-xl border border-primary/20 bg-primary/[0.04] p-6">
        <h2 className="text-lg font-semibold text-foreground">New since spring 2026</h2>
        <ul className="mt-4 space-y-2 text-foreground-muted text-sm list-disc pl-5">
          <li>MCP servers for Cursor and ChatGPT (creator + integrator toolsets)</li>
          <li>Chime-style notification sounds (Learn settings + Studio generation)</li>
          <li>30+ UI locales, org default language, multilingual TTS</li>
          <li>Tutor memory LLM cadence (learner + org governance)</li>
          <li>Personalization v2 overlays, consent, and learner groups</li>
          <li>Proactive tutor chips and idle nudges with choice replies</li>
          <li>Trust pack and Studio Governance page</li>
        </ul>
        <Link href="/guides" className="mt-4 inline-block text-primary hover:underline font-medium">
          Browse walkthroughs →
        </Link>
      </div>
    </ProseSection>
  );
}

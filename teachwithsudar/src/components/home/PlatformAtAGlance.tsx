"use client";

import Link from "next/link";
import { ResponsiveCardGrid } from "@/components/ui/ResponsiveCardGrid";
import { platformCapabilities } from "@/data/platformCapabilities";

const highlights = [
  platformCapabilities.find((c) => c.id === "doc-to-course"),
  platformCapabilities.find((c) => c.id === "modalities"),
  platformCapabilities.find((c) => c.id === "tutor-memory"),
  platformCapabilities.find((c) => c.id === "mcp-remote"),
  platformCapabilities.find((c) => c.id === "notification-sounds"),
  platformCapabilities.find((c) => c.id === "learn-i18n"),
].filter(Boolean);

export function PlatformAtAGlance() {
  return (
    <section className="py-24 sm:py-32 bg-[#060606] border-t border-white/[0.04]" aria-label="Platform at a glance">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="reveal text-center mb-14">
          <span className="text-[10px] tracking-[0.35em] text-[#FF4500]/60 uppercase font-mono">
            What ships today
          </span>
          <h2 className="mt-4 text-4xl sm:text-5xl font-serif font-medium text-white leading-[1.1] tracking-tight text-balance">
            Built in the open. Documented here.
          </h2>
          <p className="mt-5 text-base text-zinc-500 max-w-2xl mx-auto font-light">
            Walk through animated wireframes for authoring, delivery, integrations, and ops, or jump
            straight into the live apps.
          </p>
        </div>

        <ResponsiveCardGrid
          gridClassName="sm:grid-cols-2 lg:grid-cols-3 gap-4"
          ariaLabel="Platform capabilities"
        >
          {highlights.map((cap) =>
            cap ? (
              <Link
                key={cap.id}
                href={cap.guideSlug ? `/guides/${cap.guideSlug}` : "/features"}
                className="reveal group h-full rounded-2xl border border-white/[0.06] bg-[#0d0d0d] p-6 hover:border-[#FF4500]/25 transition-all"
              >
                <p className="text-[10px] font-mono tracking-widest text-[#FF4500]/50 uppercase">
                  {cap.surface}
                </p>
                <h3 className="mt-2 text-lg font-medium text-white/90 group-hover:text-white">
                  {cap.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed">{cap.summary}</p>
                <span className="mt-4 inline-block text-xs text-[#FF4500]/70 group-hover:text-[#FF4500] font-mono tracking-wide">
                  {cap.guideSlug ? "Walkthrough →" : "Features →"}
                </span>
              </Link>
            ) : null
          )}
        </ResponsiveCardGrid>

        <div className="reveal mt-12 flex flex-wrap justify-center gap-6 text-sm">
          <Link href="/guides" className="text-[#FF4500]/80 hover:text-[#FF4500] font-medium">
            All guides →
          </Link>
          <Link href="/features" className="text-zinc-500 hover:text-zinc-300">
            Full catalog →
          </Link>
          <Link href="/help/studio" className="text-zinc-500 hover:text-zinc-300">
            Help center →
          </Link>
        </div>
      </div>
    </section>
  );
}

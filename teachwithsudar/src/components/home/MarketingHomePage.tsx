"use client";

import Link from "next/link";
import { HeroSection } from "@/components/home/HeroSection";
import { PlatformAtAGlance } from "@/components/home/PlatformAtAGlance";
import { STUDIO_APP_URL, LEARN_APP_URL, GITHUB_URL } from "@/lib/site-nav";
import * as React from "react";
import {
  ModalityPreviewPanel,
  type ModalityPreviewId,
  type ModalityPreviewMode,
} from "@/components/home/ModalityPreviewPanel";
import { SectionReveal } from "@/components/home/SectionReveal";

// ─── Impact numbers ────────────────────────────────────────────────────────────

function ImpactNumbers() {
  const stats = [
    { value: "$370B", label: "spent on corporate training annually", sub: "Much of it never shows up on the job." },
    { value: "15%", label: "average LMS course completion rate", sub: "A number teams have learned to expect." },
    { value: "70%", label: "of new knowledge forgotten within 24h", sub: "Ebbinghaus measured this in 1885." },
  ];

  return (
    <section className="border-y border-white/[0.05] bg-[#080808]" aria-label="Industry statistics">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.05]">
          {stats.map((s, i) => (
            <div
              key={i}
              className="reveal px-6 py-10 sm:py-12 text-center"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <p className="text-4xl sm:text-5xl font-serif font-medium text-white mb-2 tracking-tight">
                {s.value}
              </p>
              <p className="text-sm text-zinc-400 mb-1 leading-snug max-w-[180px] mx-auto">
                {s.label}
              </p>
              <p className="text-[11px] text-zinc-600 italic font-mono">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── The crisis ────────────────────────────────────────────────────────────────

function TheCrisis() {
  return (
    <section className="py-24 sm:py-32 md:py-40" aria-label="The problem">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="reveal mb-4">
            <span className="text-[10px] tracking-[0.35em] text-[#FF4500]/60 uppercase font-mono">
              The Problem
            </span>
          </div>

          <h2 className="reveal text-4xl sm:text-5xl md:text-6xl font-serif font-medium text-white leading-[1.1] tracking-tight mb-10 text-balance" style={{ transitionDelay: "100ms" }}>
            Corporate learning is broken.
            <br />
            <span className="italic font-light text-white/50">
              Not for lack of effort.
            </span>
          </h2>

          <div className="reveal space-y-6 text-lg text-zinc-400 font-light leading-relaxed" style={{ transitionDelay: "200ms" }}>
            <p>
              Most LMS platforms (Moodle, Canvas, Blackboard) were built to host content and record completions.
              The same module goes to every employee, whether they are new to the topic or not, and whether they
              learn better from text, audio, or practice. Last session&apos;s struggles rarely shape what they see
              next.
            </p>
            <p>
              Learning science has been clearer for decades: review at intervals, offer more than one format, adjust
              difficulty to prior knowledge, give feedback while people work. Those ideas are easy to describe and
              hard to find in the tools most companies buy.
            </p>
            <p>
              <span className="text-white/80">Training budgets grow; transfer often does not.</span> Teams that need
              real skills get compliance checklists. L&D leads who want better outcomes spend their time fighting
              software instead of improving courses.
            </p>
          </div>

          <div className="reveal mt-12 pt-10 border-t border-white/[0.06]" style={{ transitionDelay: "300ms" }}>
            <p className="text-xl sm:text-2xl text-white/70 font-serif italic leading-relaxed">
              &ldquo;We built Sudar because the category needed to catch up. The research has been there for a long
              time.&rdquo;
            </p>
          </div>

          <div className="reveal mt-8" style={{ transitionDelay: "400ms" }}>
            <Link
              href="/story"
              className="text-[11px] tracking-[0.3em] text-[#FF4500]/70 hover:text-[#FF4500] transition-colors uppercase font-mono"
            >
              The story behind Sudar →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Platform architecture ─────────────────────────────────────────────────────

function PlatformArchitecture() {
  const products = [
    {
      number: "01",
      name: "Sudar Studio",
      verb: "Author",
      tagline: "From a document or URL to a published course in under ten minutes.",
      description:
        "Upload a PDF, paste a URL, or describe a topic. Studio drafts structure and copy across 14 templates so you can edit, approve, and publish without a separate design team.",
      features: ["AI course generation from any document", "14 professional visual templates", "SCORM & LMS export", "Org-wide governance & approval flows"],
      href: STUDIO_APP_URL,
      external: true,
      accent: true,
    },
    {
      number: "02",
      name: "Sudar Intelligence",
      verb: "Adapt",
      tagline: "The AI brain shared by Studio and Learn.",
      description:
        "A FastAPI service shared by Studio and Learn. It maintains the Digital Learner Twin (a persistent profile per person), scores modality fit and skill gaps, and returns next-best-action recommendations as events arrive.",
      features: ["Digital Learner Twin (persistent learner model)", "Adaptive content sequencing engine", "AI tutor with governed longitudinal memory (learner + org cadence)", "Real-time next-best-action inference"],
      href: "/features",
      external: false,
      accent: false,
    },
    {
      number: "03",
      name: "Sudar Learn",
      verb: "Deliver",
      tagline: "Every learner gets a tutor, a path, and seven ways to learn.",
      description:
        "Where learners take courses. They can switch between text, video, audio, mind map, flashcards, short-form feed, or game-style practice. Tutor Sudar answers questions, nudges when someone is stuck, and uses prior sessions as context.",
      features: ["7 learning modalities", "Tutor Sudar with session memory", "Mobile-first layout", "Progress and skill tracking"],
      href: LEARN_APP_URL,
      external: true,
      accent: false,
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-[#060606]" aria-label="Platform architecture">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="reveal text-center mb-16 sm:mb-20">
          <span className="text-[10px] tracking-[0.35em] text-[#FF4500]/60 uppercase font-mono">
            The Platform
          </span>
          <h2 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-serif font-medium text-white leading-[1.1] tracking-tight text-balance">
            Studio. Intelligence. Learn.
            <br />
            <span className="italic font-light text-white/50">One learner model. Three surfaces.</span>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-zinc-500 max-w-2xl mx-auto font-light">
            Studio, Intelligence, and Learn share one database. What you publish in Studio and what learners do in
            Learn both feed the same profile, so recommendations stay consistent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((p, i) => (
            <div
              key={p.number}
              className="reveal group"
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div
                className={`h-full flex flex-col rounded-2xl border p-8 transition-all duration-500 ${
                  p.accent
                    ? "bg-[#FF4500] border-[#FF4500] hover:shadow-[0_20px_60px_rgba(255,69,0,0.25)]"
                    : "bg-[#0d0d0d] border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <div className="flex items-start justify-between mb-8">
                  <span
                    className={`text-[10px] font-mono tracking-widest ${
                      p.accent ? "text-black/50" : "text-zinc-600"
                    }`}
                  >
                    {p.number}
                  </span>
                  <span
                    className={`text-[10px] font-mono tracking-[0.3em] uppercase border px-3 py-1 rounded-full ${
                      p.accent
                        ? "border-black/15 text-black/60"
                        : "border-white/[0.07] text-zinc-600"
                    }`}
                  >
                    {p.verb}
                  </span>
                </div>

                <h3
                  className={`text-2xl font-serif font-medium mb-2 ${
                    p.accent ? "text-black" : "text-white"
                  }`}
                >
                  {p.name}
                </h3>
                <p
                  className={`text-sm mb-5 leading-snug font-medium ${
                    p.accent ? "text-black/70" : "text-[#FF4500]/80"
                  }`}
                >
                  {p.tagline}
                </p>
                <p
                  className={`text-sm leading-relaxed mb-8 flex-1 ${
                    p.accent ? "text-black/65" : "text-zinc-500"
                  }`}
                >
                  {p.description}
                </p>

                <ul className="space-y-2 mb-8">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-start gap-2 text-xs ${
                        p.accent ? "text-black/70" : "text-zinc-500"
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-1 h-1 rounded-full flex-shrink-0 ${
                          p.accent ? "bg-black/40" : "bg-[#FF4500]/50"
                        }`}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <div>
                  {p.external ? (
                    <a
                      href={p.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 text-xs font-medium tracking-wide transition-all duration-200 group-hover:gap-2.5 ${
                        p.accent
                          ? "text-black hover:text-black/70"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      Open {p.name}
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </a>
                  ) : (
                    <Link
                      href={p.href}
                      className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-white/60 hover:text-white transition-all duration-200 group-hover:gap-2.5"
                    >
                      Learn more
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Digital Learner Twin ──────────────────────────────────────────────────────

function DigitalLearnerTwin() {
  const signals = [
    { label: "Modality Affinity", desc: "Does this learner absorb video better than text? Prefer flashcards over long-form? Sudar knows." },
    { label: "Engagement Patterns", desc: "Session duration, replay rate, drop-off points, time-to-completion. Every interaction is a signal." },
    { label: "Skill Graph", desc: "What has been mastered? Where are the gaps? What prerequisite knowledge is missing?" },
    { label: "Cognitive Load Index", desc: "Is the learner being overwhelmed or under-challenged? Content complexity adjusts in real time." },
    { label: "Session Memory", desc: "Tutor Sudar can refer back to earlier questions, misconceptions, and progress instead of treating each visit as a first meeting." },
    { label: "Next Best Action", desc: "At the end of every session, Intelligence computes the single most valuable next step for this learner." },
  ];

  return (
    <section className="py-24 sm:py-32 md:py-40 relative overflow-hidden" aria-label="Digital Learner Twin">
      {/* Background accent */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] blur-[160px] opacity-[0.07] pointer-events-none"
        style={{ background: "radial-gradient(circle, #FF4500, transparent)" }}
        aria-hidden
      />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-start">
          {/* Left: copy */}
          <div>
            <div className="reveal mb-4">
              <span className="text-[10px] tracking-[0.35em] text-[#FF4500]/60 uppercase font-mono">
                Core Innovation
              </span>
            </div>
            <h2 className="reveal text-4xl sm:text-5xl font-serif font-medium text-white leading-[1.1] tracking-tight mb-8 text-balance" style={{ transitionDelay: "100ms" }}>
              A profile that updates as people actually learn.
            </h2>
            <div className="reveal space-y-5 text-base text-zinc-400 font-light leading-relaxed" style={{ transitionDelay: "200ms" }}>
              <p>
                The <strong className="text-white/80 font-normal">Digital Learner Twin</strong> is Sudar&apos;s
                per-learner record. It goes beyond a completion checkbox: modality use, time on task, quiz results,
                tutor exchanges, and drop-off points accumulate over time.
              </p>
              <p>
                Learners never see a raw dashboard of scores. The twin sits behind routing (which modality to suggest),
                when the tutor should check in, which module to surface next, and when someone looks ready for an
                assessment.
              </p>
              <p>
                The goal is practical: fewer generic paths, more responses that fit what this person has already done.
              </p>
            </div>
            <div className="reveal mt-10" style={{ transitionDelay: "300ms" }}>
              <Link
                href="/alp"
                className="inline-flex items-center gap-2 text-[#FF4500]/80 hover:text-[#FF4500] text-sm font-medium transition-colors"
              >
                Explore the Adaptive Learning Protocol →
              </Link>
            </div>
          </div>

          {/* Right: signal grid */}
          <div className="reveal" style={{ transitionDelay: "200ms" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {signals.map((s, i) => (
                <div
                  key={i}
                  className="group p-5 rounded-xl border border-white/[0.06] bg-[#0d0d0d] hover:border-[#FF4500]/20 hover:bg-[#0f0f0f] transition-all duration-400"
                >
                  <p className="text-xs font-medium text-white/80 mb-2 tracking-wide">{s.label}</p>
                  <p className="text-xs text-zinc-600 leading-relaxed group-hover:text-zinc-500 transition-colors">{s.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 rounded-xl border border-[#FF4500]/10 bg-[#FF4500]/[0.03] flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500]/60 flex-shrink-0 mt-1.5" />
              <p className="text-xs text-zinc-500 leading-relaxed">
                Twin data stays in infrastructure you control, your database, your region, your
                retention policies. Sudar is built for data sovereignty: self-host in your tenant,
                choose your AI providers, and keep learner records where your organisation requires
                them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Trust & guardrails ────────────────────────────────────────────────────────

function TrustAndGuardrails() {
  const pillars = [
    {
      title: "Safety",
      summary: "AI that stays inside the course, with guardrails operators can see and tune.",
      points: [
        "Sensitive-input checks on tutor and generation routes before content reaches a model.",
        "Tutor Sudar is RAG-bound to published course material, not the open web.",
        "Org governance in Studio: memory cadence, personalization limits, and approval flows.",
        "Proactive nudges are designed to help, not pressure; configurable per deployment.",
      ],
    },
    {
      title: "Privacy",
      summary: "Tenant-scoped by default. Learner context is collected for learning, not resale.",
      points: [
        "Organisation-scoped data, no cross-tenant reads in the reference architecture.",
        "Learners can review surfaced context, adjust preferences, and opt out of tutor memory.",
        "You choose cloud inference or private/self-hosted model endpoints.",
        "Sudar does not sell learner profiles; deployers control subprocessors and API keys.",
      ],
    },
    {
      title: "Security",
      summary: "Hardening you can audit, especially when you self-host.",
      points: [
        "Role-aware access and row-level isolation in the reference Postgres stack.",
        "Fail-closed scheduled jobs, dedicated signing secrets, and SSRF-resistant ingestion.",
        "SCORM, embed, and media proxies enforce ownership before privileged access.",
        "Technical trust pack in the repo: threat model, data flows, and operator checklists.",
      ],
    },
    {
      title: "Compliance & rights",
      summary: "Built for teams who must answer GDPR, FERPA, and UK GDPR questions.",
      points: [
        "Deployer remains data controller; Sudar supplies software and documented flows.",
        "Support for access, correction, export, and erasure workflows (policy-driven retention).",
        "Subprocessor transparency, hosting, email, and model vendors are your choices.",
        "Governance surfaces in Studio link operators to the evidence procurement needs.",
      ],
    },
  ];

  return (
    <section
      className="py-24 sm:py-32 md:py-40 bg-[#080808] border-y border-white/[0.04]"
      aria-label="Trust, safety, and data sovereignty"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="reveal max-w-3xl">
          <span className="text-[10px] tracking-[0.35em] text-[#FF4500]/60 uppercase font-mono">
            Trust &amp; guardrails
          </span>
          <h2 className="mt-4 text-4xl sm:text-5xl font-serif font-medium text-white leading-[1.1] tracking-tight text-balance">
            Your data. Your infrastructure.
            <br />
            <span className="italic font-light text-white/50">Your learners&apos; rights.</span>
          </h2>
          <p className="mt-5 text-base text-zinc-500 max-w-2xl font-light leading-relaxed">
            Sudar&apos;s reference stack runs on Postgres with tenant isolation, but the principle
            is broader: learning records should live where{" "}
            <strong className="font-normal text-white/70">you</strong> choose, your cloud
            account, your VPC, your region, with policies your legal team can defend.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-5">
          {pillars.map((pillar, i) => (
            <div
              key={pillar.title}
              className="reveal rounded-2xl border border-white/[0.06] bg-[#0d0d0d] p-7 sm:p-8"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <p className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#FF4500]/55">
                {pillar.title}
              </p>
              <p className="mt-3 text-sm text-white/80 leading-relaxed">{pillar.summary}</p>
              <ul className="mt-5 space-y-3">
                {pillar.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-xs text-zinc-500 leading-relaxed">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[#FF4500]/50" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="reveal mt-8 rounded-2xl border border-[#FF4500]/15 bg-[#FF4500]/[0.04] p-8 sm:p-10"
          style={{ transitionDelay: "320ms" }}
        >
          <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-[#FF4500]/70">
            Long-term alignment
          </p>
          <p className="mt-4 text-xl sm:text-2xl font-serif font-medium text-white leading-snug text-balance">
            Learning data exists to serve the learner, not to enrich a vendor&apos;s model or ad
            business.
          </p>
          <div className="mt-6 space-y-4 text-sm text-zinc-400 font-light leading-relaxed max-w-3xl">
            <p>
              Sudar does not claim ownership of learner profiles, tutor conversations, or progress
              records. The Digital Learner Twin is a tool for better teaching, not a data asset for
              Sudar or your organisation to monetise without the learner&apos;s knowledge and
              consent.
            </p>
            <p>
              We publish the trust pack and source code so institutions can verify behaviour instead
              of trusting marketing slides. Product direction stays anchored to learner agency:
              portable records, minimal necessary inference, and governance defaults that favour
              privacy over surveillance.
            </p>
          </div>
        </div>

        <div className="reveal mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
          <Link href="/privacy" className="text-[#FF4500]/80 hover:text-[#FF4500] font-medium transition-colors">
            Privacy Policy →
          </Link>
          <Link href="/help/studio" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            Studio help &amp; governance →
          </Link>
          <Link href="/faq" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            FAQ: privacy &amp; GDPR →
          </Link>
          <a
            href={`${GITHUB_URL}/tree/main/docs/trust`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Trust pack (docs/trust) →
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Modalities ────────────────────────────────────────────────────────────────

function Modalities() {
  const modes: Array<ModalityPreviewMode & { id: ModalityPreviewId; icon: React.ReactNode }> = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      id: "Text",
      name: "Text",
      tag: "Default",
      desc: "Structured long-form reading. Clean typography, section navigation, AI-generated summaries.",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
      id: "Video",
      name: "Video",
      tag: "Visual",
      desc: "AI-generated narrated video presentations. No filming required. Full captions and transcripts.",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
      ),
      id: "Audio",
      name: "Audio",
      tag: "Auditory",
      desc: "Podcast-style lessons. Natural TTS narration. Ideal for commute learning and accessibility.",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        </svg>
      ),
      id: "Mind Map",
      name: "Mind Map",
      tag: "Spatial",
      desc: "Visual knowledge architecture. See how concepts connect. Ideal for systems thinkers.",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
      id: "Flashcards",
      name: "Flashcards",
      tag: "Spaced Repetition",
      desc: "Adaptive recall sessions. Spaced repetition scheduling fights the Ebbinghaus forgetting curve.",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 2.25h3m-3 2.25h3M3 12h.008v.008H3V12zm0 2.25h.008v.008H3v-.008zm0 2.25h.008v.008H3V16.5z" />
        </svg>
      ),
      id: "SudarFeed",
      name: "SudarFeed",
      tag: "Microlearning",
      desc: "Short vertical clips in a scrollable feed. Useful when learners want small chunks instead of a long module.",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.4.959.4v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
        </svg>
      ),
      id: "SudarPlay",
      name: "SudarPlay",
      tag: "Gamified",
      desc: "Interactive scenario-based games. Applied learning in context. High retention, high engagement.",
    },
  ];

  const [activeId, setActiveId] = React.useState<ModalityPreviewId | null>(null);

  const active = React.useMemo(() => {
    if (!activeId) return null;
    const found = modes.find((m) => m.id === activeId);
    return found
      ? {
          id: found.id,
          name: found.name,
          tag: found.tag,
          desc: found.desc,
        }
      : null;
  }, [activeId, modes]);

  const close = React.useCallback(() => setActiveId(null), []);

  React.useEffect(() => {
    if (!activeId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeId, close]);

  return (
    <section id="modalities" className="py-24 sm:py-32 bg-[#060606]" aria-label="Learning modalities">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="reveal text-center mb-14 sm:mb-18">
          <span className="text-[10px] tracking-[0.35em] text-[#FF4500]/60 uppercase font-mono">
            Modalities
          </span>
          <h2 className="mt-4 text-4xl sm:text-5xl font-serif font-medium text-white leading-[1.1] tracking-tight text-balance">
            One course. Seven ways to experience it.
          </h2>
          <p className="mt-5 text-base text-zinc-500 max-w-xl mx-auto font-light leading-relaxed">
            Write the course once in Studio. Intelligence can render the same material as text, audio, video,
            cards, and more without maintaining separate copies for each format.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modes.map((m, i) => (
            <SectionReveal key={m.name} delay={(i % 4) * 0.08} className="h-full">
              <button
                type="button"
                onClick={() => setActiveId((cur) => (cur === m.id ? null : m.id))}
                className={`group h-full w-full p-6 rounded-2xl border bg-[#0d0d0d] hover:bg-[#111] transition-all duration-400 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4500]/50 ${
                  activeId === m.id ? "border-[#FF4500]/25" : "border-white/[0.05] hover:border-white/[0.10]"
                }`}
                aria-expanded={activeId === m.id}
                aria-controls="modality-preview-overlay"
                aria-label={`${activeId === m.id ? "Close" : "Open"} ${m.name} preview`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center text-[#FF4500]/70 group-hover:text-[#FF4500] group-hover:bg-[#FF4500]/[0.08] transition-all duration-300">
                    {m.icon}
                  </div>
                  <span className="text-[9px] font-mono tracking-widest text-zinc-700 border border-white/[0.05] px-2 py-0.5 rounded-full">
                    {m.tag}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-medium text-white/90 mb-2">{m.name}</h3>
                  <span
                    className={`mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-mono tracking-widest transition-colors ${
                      activeId === m.id
                        ? "border-[#FF4500]/20 bg-[#FF4500]/[0.05] text-[#FF4500]/70"
                        : "border-white/[0.06] bg-white/[0.02] text-zinc-700 group-hover:text-zinc-600"
                    }`}
                  >
                    Preview
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed group-hover:text-zinc-500 transition-colors">
                  {m.desc}
                </p>
              </button>
            </SectionReveal>
          ))}

          {/* "And more" placeholder */}
          <SectionReveal delay={0.56} className="h-full">
            <div className="group h-full p-6 rounded-2xl border border-dashed border-white/[0.05] flex flex-col items-center justify-center text-center gap-3 min-h-[160px]">
              <Link
                href="/modalities"
                className="text-xs text-zinc-600 hover:text-[#FF4500]/70 transition-colors font-mono tracking-wide"
              >
                Explore all modalities →
              </Link>
            </div>
          </SectionReveal>
        </div>

        <ModalityPreviewPanel active={active} onClose={close} />
      </div>
    </section>
  );
}

// ─── Research foundation ───────────────────────────────────────────────────────

function ResearchFoundation() {
  const citations = [
    {
      theory: "Forgetting Curve",
      author: "Hermann Ebbinghaus",
      year: "1885",
      journal: "Über das Gedächtnis",
      era: "Foundation",
      finding:
        "Without reinforcement, learners forget most new information within days — a pattern replicated for over a century. Spaced review is the standard countermeasure.",
      how: "Spaced repetition in Flashcards & Adaptive Sequencing",
    },
    {
      theory: "Multimedia Learning",
      author: "Richard E. Mayer",
      year: "2009",
      journal: "Multimedia Learning, 2nd ed.",
      era: "Foundation",
      finding:
        "People learn more deeply when words and visuals work together than from text alone. Learners differ in which channel combinations help them encode material.",
      how: "Seven adaptive modalities per course",
    },
    {
      theory: "Testing Effect",
      author: "Roediger & Karpicke",
      year: "2006",
      journal: "Psychological Science, 17(3)",
      era: "Modern validation",
      finding:
        "Retrieval practice — answering questions, not just re-reading — strengthens long-term retention more than passive review alone.",
      how: "In-module quizzes, flashcards, and struggle signals in the Digital Learner Twin",
    },
    {
      theory: "Intelligent Tutoring Systems",
      author: "Kurt VanLehn",
      year: "2011",
      journal: "Educational Psychologist, 46(4)",
      era: "Modern validation",
      finding:
        "Meta-analysis shows adaptive tutoring and ITS approaches outperform fixed classroom instruction — the gap mainstream LMS products still leave open.",
      how: "Adaptive sequencing, Next Best Action, and the AI tutor sidebar",
    },
    {
      theory: "AI-Augmented Textbooks",
      author: "LearnLM Team (Google)",
      year: "2025",
      journal: "arXiv:2509.13348",
      era: "AI era",
      finding:
        "Personalised, multimodal views of the same source material (text, slides, audio, mind maps) with formative checks improved learning in a randomised trial.",
      how: "Author once, deliver in text, video, audio, mind map, flashcards, and more",
    },
    {
      theory: "Memory-Aware AI Tutoring",
      author: "Liu et al. (AgentTutor)",
      year: "2026",
      journal: "arXiv:2601.04219",
      era: "AI era",
      finding:
        "Multi-turn tutoring with knowledge memory and strategy adjustment beats stateless chat — yet most LLM tutors still reset every session.",
      how: "Cross-session tutor memory in ai_tutor_context and consent-governed learner model updates",
    },
  ];

  const eraBadgeClass: Record<(typeof citations)[number]["era"], string> = {
    Foundation: "text-zinc-500 border-white/10 bg-white/[0.03]",
    "Modern validation": "text-zinc-400 border-white/15 bg-white/[0.05]",
    "AI era": "text-[#FF4500]/70 border-[#FF4500]/20 bg-[#FF4500]/[0.06]",
  };

  return (
    <section className="py-24 sm:py-32 md:py-40" aria-label="Research foundation">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mb-14 sm:mb-18">
          <span className="text-[10px] tracking-[0.35em] text-[#FF4500]/60 uppercase font-mono">
            Research Foundation
          </span>
          <h2 className="mt-4 text-4xl sm:text-5xl font-serif font-medium text-white leading-[1.1] tracking-tight max-w-3xl text-balance">
            Grounded in published research.
            <br />
            <span className="italic font-light text-white/50">Mapped to product choices you can inspect.</span>
          </h2>
          <p className="mt-5 text-base text-zinc-500 max-w-2xl font-light leading-relaxed">
            Durable foundations from Ebbinghaus and Mayer, modern validation from retrieval practice and tutoring
            meta-analyses, and 2020s AI-era trials — each mapped to a feature you can inspect in the open codebase.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {citations.map((c, i) => (
            <div
              key={i}
              className="citation-card reveal group p-7 rounded-2xl border border-white/[0.06] bg-[#0d0d0d] hover:border-white/10 transition-all duration-400 overflow-hidden"
              style={{ transitionDelay: `${(i % 2) * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-5 gap-4">
                <div>
                  <p className="text-base font-medium text-white/90 mb-1">{c.theory}</p>
                  <p className="text-xs text-zinc-600 font-mono">
                    {c.author} · {c.year} · <em className="not-italic text-zinc-700">{c.journal}</em>
                  </p>
                </div>
                <span
                  className={`text-[10px] font-mono tracking-widest border px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap ${eraBadgeClass[c.era]}`}
                >
                  {c.era} · {c.year}
                </span>
              </div>
              <div className="citation-line mb-5" />
              <p className="text-sm text-zinc-500 leading-relaxed mb-5 group-hover:text-zinc-400 transition-colors">
                {c.finding}
              </p>
              <p className="text-[11px] text-[#FF4500]/60 font-mono tracking-wide">
                ↳ Sudar: {c.how}
              </p>
            </div>
          ))}
        </div>

        <div className="reveal mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-6" style={{ transitionDelay: "400ms" }}>
          <Link
            href="/research"
            className="inline-flex items-center gap-2 text-[#FF4500]/70 hover:text-[#FF4500] text-sm font-medium transition-colors"
          >
            Full research foundation →
          </Link>
          <span className="hidden sm:block w-px h-4 bg-white/10" />
          <Link
            href="/papers"
            className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Read the research papers →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Open by Design ────────────────────────────────────────────────────────────

function OpenByDesign() {
  return (
    <section className="py-24 sm:py-32 bg-[#060606] border-t border-white/[0.04]" aria-label="Open source">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="reveal mb-4">
              <span className="text-[10px] tracking-[0.35em] text-[#FF4500]/60 uppercase font-mono">
                Open by Design
              </span>
            </div>
            <h2 className="reveal text-4xl sm:text-5xl font-serif font-medium text-white leading-[1.1] tracking-tight mb-8 text-balance" style={{ transitionDelay: "100ms" }}>
              The best learning tools
              <br />
              <span className="italic font-light text-white/50">should not cost a fortune.</span>
            </h2>
            <div className="reveal space-y-5 text-base text-zinc-400 font-light leading-relaxed" style={{ transitionDelay: "200ms" }}>
              <p>
                Sudar is Apache-2.0 and designed to run on infrastructure you choose: common free tiers for the
                Next.js apps and Intelligence, plus a Postgres-compatible database in your account or VPC. Many teams
                can host for{" "}
                <strong className="text-white/80 font-normal">$0</strong> before they outgrow hobby limits.
              </p>
              <p>
                You can read the code that scores learners, routes modalities, and powers the tutor. Fork it, audit
                it, or patch it for your org without negotiating a proprietary roadmap.
              </p>
            </div>

            <div className="reveal mt-10 flex flex-wrap gap-4" style={{ transitionDelay: "300ms" }}>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] hover:border-white/[0.14] text-white/80 hover:text-white font-medium px-6 py-3 rounded-full transition-all duration-300 text-sm tracking-wide"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                Star on GitHub
              </a>
              <Link
                href="/self-host"
                className="inline-flex items-center gap-2 text-[#FF4500]/70 hover:text-[#FF4500] border border-[#FF4500]/20 hover:border-[#FF4500]/40 px-6 py-3 rounded-full transition-all duration-300 text-sm tracking-wide"
              >
                Self-host guide →
              </Link>
            </div>
          </div>

          {/* Manifesto */}
          <div className="reveal" style={{ transitionDelay: "200ms" }}>
            <div className="p-8 rounded-2xl border border-white/[0.06] bg-[#0d0d0d] space-y-6">
              <p className="text-[10px] tracking-[0.35em] text-zinc-700 uppercase font-mono">
                Manifesto
              </p>
              {[
                "Learners differ. Defaulting everyone to the same path is a design choice, not a law of nature.",
                "The research on how people learn is extensive. Most products still ship as if it were not.",
                "Source code you can read beats black-box claims about personalization.",
                "A tutor that keeps context across sessions behaves differently from a one-off chat window.",
                "Corporate training works better when it adapts to the person, not only the compliance deadline.",
              ].map((line, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="text-[#FF4500]/40 font-mono text-xs mt-0.5 flex-shrink-0 w-5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm text-zinc-400 leading-relaxed font-light">{line}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Closing CTA ───────────────────────────────────────────────────────────────

function ClosingCTA() {
  return (
    <section className="py-24 sm:py-32 md:py-40 border-t border-white/[0.04] relative overflow-hidden" aria-label="Get started">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(255,69,0,0.08) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="reveal mb-4">
          <span className="text-[10px] tracking-[0.35em] text-[#FF4500]/60 uppercase font-mono">
            Get Started
          </span>
        </div>
        <h2 className="reveal text-4xl sm:text-5xl md:text-6xl font-serif font-medium text-white leading-[1.05] tracking-tight mb-6 text-balance" style={{ transitionDelay: "100ms" }}>
          Your learners deserve better
          <br />
          <span className="italic font-light text-white/50">than what they&rsquo;re getting.</span>
        </h2>
        <p className="reveal text-base sm:text-lg text-zinc-500 max-w-xl mx-auto mb-12 font-light leading-relaxed" style={{ transitionDelay: "200ms" }}>
          Open Sudar Studio (free, no card). Publish a first course from a document or URL and walk through it in
          Learn to see how the tutor and modalities behave.
        </p>

        <div className="reveal flex flex-col sm:flex-row items-center justify-center gap-4 mb-16" style={{ transitionDelay: "300ms" }}>
          <a
            href={STUDIO_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 bg-[#FF4500] hover:bg-[#FF5722] text-white font-medium px-10 py-4 rounded-full transition-all duration-300 text-sm tracking-wide shadow-[0_0_40px_rgba(255,69,0,0.30)] hover:shadow-[0_0_60px_rgba(255,69,0,0.50)]"
          >
            Start building (free)
            <svg
              className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
          <Link
            href="/self-host"
            className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors tracking-wide"
          >
            Self-host at $0 →
          </Link>
        </div>

        <div className="reveal flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[10px] text-zinc-700 font-mono tracking-widest uppercase" style={{ transitionDelay: "400ms" }}>
          <Link href="/features" className="hover:text-zinc-400 transition-colors">Features</Link>
          <Link href="/guides" className="hover:text-zinc-400 transition-colors">Guides</Link>
          <Link href="/research" className="hover:text-zinc-400 transition-colors">Research</Link>
          <Link href="/alp" className="hover:text-zinc-400 transition-colors">ALP Plugin</Link>
          <Link href="/compare" className="hover:text-zinc-400 transition-colors">Compare</Link>
          <Link href="/blog" className="hover:text-zinc-400 transition-colors">Blog</Link>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">GitHub</a>
        </div>
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function MarketingHomePage() {
  return (
    <div className="w-full">
      <HeroSection />
      <ImpactNumbers />
      <TheCrisis />
      <PlatformArchitecture />
      <PlatformAtAGlance />
      <DigitalLearnerTwin />
      <TrustAndGuardrails />
      <Modalities />
      <ResearchFoundation />
      <OpenByDesign />
      <ClosingCTA />
    </div>
  );
}

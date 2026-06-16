import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";

export const metadata = {
  title: "Research Papers | Sudar",
  description:
    "Sudar and the Adaptive Learning Layer (ALP) are described in peer-reviewed academic work. Read the primary paper, cite it, and explore the evidence base.",
};

const KEYWORDS = [
  "adaptive learning",
  "intelligent tutoring",
  "learner modelling",
  "digital learner twin",
  "open-source LMS",
  "multimodal learning",
  "LLMs in education",
  "plugin architecture",
  "AI-native education",
];

const CONTRIBUTIONS = [
  {
    number: "01",
    label: "LAMP: Reference Platform",
    summary:
      "A fully open-source, working implementation of an AI-native learning system that unifies authoring, delivery, and intelligence around a persistent Digital Learner Twin, adaptive sequencing, six multimodal delivery formats (text + read-along TTS, animated video, audio podcast, mindmap, flashcards, SCORM), bounded agent orchestration (SudarAgents), and an AI tutor with longitudinal cross-session memory and consent-gated generative personalisation.",
  },
  {
    number: "02",
    label: "ALP: Adaptive Learning Layer",
    summary:
      "A novel plugin architecture enabling Sudar's capabilities (learner memory, adaptive tutoring, next-best-action recommendations, and modality choice) to be deployed as independently installable services on top of existing LMSs (Moodle, Canvas, Blackboard) without requiring platform replacement. Architecturally aligned with Moodle 4.5's AI subsystem. Potential reach: 500 million registered Moodle users across 233 countries.",
  },
  {
    number: "03",
    label: "Economic Analysis",
    summary:
      "Empirically observed infrastructure cost data demonstrating a >99% cost reduction relative to both incumbent commercial LMS licensing fees and proprietary AI provider stacks. Full AI-native personalised learning delivered at $0.021 per learner per month (less than the cost of a single SMS) using open-weight models and zero-cost TTS. All figures verified against Q1 2026 provider pricing.",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Learner model",
    sudar: "Longitudinal Digital Twin",
    khanmigo: "Session-scoped",
    learnlm: "Stateless",
    typicalLms: "None",
  },
  {
    feature: "Tutor memory",
    sudar: "Cross-session, cross-course",
    khanmigo: "Within session",
    learnlm: "Not claimed",
    typicalLms: "Stateless",
  },
  {
    feature: "Open learner model",
    sudar: "✓ (inspectable + editable)",
    khanmigo: "No",
    learnlm: "No",
    typicalLms: "No",
  },
  {
    feature: "Modalities",
    sudar: "6 (text/listen/video/podcast/map/cards)",
    khanmigo: "Text",
    learnlm: "Text / slides / audio / map",
    typicalLms: "Text / video",
  },
  {
    feature: "Augments existing LMS",
    sudar: "✓ (ALP)",
    khanmigo: "No",
    learnlm: "No",
    typicalLms: "N/A",
  },
  {
    feature: "Open source",
    sudar: "✓ Apache 2.0",
    khanmigo: "No",
    learnlm: "No",
    typicalLms: "Rarely",
  },
  {
    feature: "Cost (1,000 learners/mo)",
    sudar: "~$21",
    khanmigo: "~$4,000",
    learnlm: "N/A",
    typicalLms: "$3,400-$44,000",
  },
];

const COST_ROWS = [
  { stack: "Sudar (Together AI 8B + Edge-TTS)", perMonth: "$21", annual1k: "$252", highlight: true },
  { stack: "Sudar (Together AI 70B + Edge-TTS)", perMonth: "$105", annual1k: "$1,260", highlight: true },
  { stack: "Self-hosted (Ollama + open-weight, GPU)", perMonth: "~$0*", annual1k: "~$0*", highlight: true },
  { stack: "GPT-4o + OpenAI TTS-1", perMonth: "$3,405", annual1k: "$40,860", highlight: false },
  { stack: "Claude 3.5 Sonnet + Azure TTS", perMonth: "$3,735", annual1k: "$44,820", highlight: false },
  { stack: "Docebo (platform licence, low end)", perMonth: "$5,830+", annual1k: "$69,960+", highlight: false },
  { stack: "Sana Labs (est., min. 300 seats)", perMonth: "~$15,000", annual1k: "~$180,000", highlight: false },
];

const BIBTEX = `@misc{karunanithi2026sudar,
  author    = {Karunanithi, Dhanikesh},
  title     = {Learning That Remembers You: An Open-Source
               {AI}-Native Learning Platform and Plugin Architecture
               for Longitudinal Learner Modelling at Scale},
  year      = {2026},
  url       = {https://github.com/Dhanikesh-Karunanithi/Sudar},
  note      = {Sudar / ALP Project. Apache-2.0 licence.
               Draft white paper — contact author for PDF.}
}`;

export default function PapersPage() {
  return (
    <ProseSection title="Research Papers" wide>
      {/* ── Intro ─────────────────────────────────────────────────────────── */}
      <p className="text-lg text-foreground/80">
        Sudar and the Adaptive Learning Layer (ALP) are described in academic work. Below is the
        primary paper, its key contributions, the full abstract, and a formatted citation.
      </p>

      {/* ── Paper card ────────────────────────────────────────────────────── */}
      <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        {/* Status badge */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
          Draft white paper · request PDF
        </div>

        <h2 className="text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
          Learning That Remembers You
        </h2>
        <p className="mt-1 text-lg text-foreground/60">
          An Open-Source AI-Native Learning Platform and Plugin Architecture for Longitudinal
          Learner Modelling at Scale
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
          <span>Dhanikesh Karunanithi</span>
          <span className="text-slate-600">·</span>
          <span>Sudar / ALP Project</span>
          <span className="text-slate-600">·</span>
          <span>2026</span>
          <span className="text-slate-600">·</span>
          <span>15 pages · 37 references</span>
        </div>

        {/* Keywords */}
        <div className="mt-5 flex flex-wrap gap-2">
          {KEYWORDS.map((kw) => (
            <span
              key={kw}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-300"
            >
              {kw}
            </span>
          ))}
        </div>

        {/* Abstract */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <p className="mb-2 text-xs font-mono uppercase tracking-widest text-slate-500">Abstract</p>
          <p className="text-[0.95rem] leading-relaxed text-foreground/80">
            Traditional learning management systems (LMSs) deliver static, one-size-fits-all
            content with no longitudinal learner model and no adaptive tutoring. Intelligent
            tutoring systems (ITS) that do adapt remain either narrow-domain research prototypes or
            products disconnected from the course-hosting infrastructure most organisations already
            use.
          </p>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-foreground/80">
            We present{" "}
            <strong className="text-foreground">Sudar</strong>, a fully open-source, AI-native
            learning system released under the Apache 2.0 licence, making three contributions:
            (1) the Sudar reference platform (LAMP), a working implementation unifying authoring,
            delivery, and intelligence around a persistent Digital Learner Twin, adaptive
            sequencing, six multimodal delivery formats, an AI tutor with longitudinal cross-session
            memory, bounded agent orchestration (SudarAgents), and consent-gated generative
            personalisation; (2) the{" "}
            <strong className="text-foreground">Adaptive Learning Layer (ALP)</strong>, a novel
            plugin architecture enabling these capabilities to be deployed as independently
            installable services on top of existing LMSs without requiring platform replacement;
            and (3) an{" "}
            <strong className="text-foreground">economic analysis</strong> demonstrating the full
            capability set can be delivered at a per-learner AI infrastructure cost below{" "}
            <strong className="text-foreground">$0.02 per month</strong>, exceeding a 99%
            reduction relative to both incumbent commercial LMS licensing fees and proprietary AI
            provider stacks.
          </p>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-foreground/80">
            The reference implementation is open source (Apache 2.0), grounded in a broad
            learning-science evidence base, and designed as an extensible bedrock on which the
            community can build additional modalities, intelligence plugins, and LMS connectors.
          </p>
        </div>

        {/* Links */}
        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6 text-sm">
          <a
            href="https://github.com/Dhanikesh-Karunanithi/Sudar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-accent hover:underline"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            Repository (GitHub)
          </a>
          <a
            href="mailto:connect@dhanikeshkarunanithi.com?subject=Sudar%20white%20paper%20draft"
            className="inline-flex items-center gap-1.5 text-accent hover:underline"
          >
            Request draft PDF
          </a>
          <span className="text-slate-600">·</span>
          <span className="text-slate-500">
            Full draft in{" "}
            <code className="rounded bg-white/5 px-1 text-xs text-slate-400">docs/research/</code>{" "}
            in the repo. arXiv submission planned for 2026.
          </span>
        </div>
      </div>

      {/* ── Three contributions ───────────────────────────────────────────── */}
      <h2 className="mt-14 text-xl font-semibold text-foreground">Three primary contributions</h2>
      <p className="mt-2 text-sm text-foreground/60">
        Each contribution addresses a distinct gap: the architectural gap, the integration gap,
        and the economic gap.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {CONTRIBUTIONS.map((c) => (
          <div
            key={c.number}
            className="flex flex-col rounded-xl border border-white/10 bg-white/[0.03] p-5"
          >
            <span className="font-mono text-2xl font-bold text-white/10">{c.number}</span>
            <p className="mt-2 font-semibold text-foreground">{c.label}</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">{c.summary}</p>
          </div>
        ))}
      </div>

      {/* ── Comparison table ──────────────────────────────────────────────── */}
      <div className="not-prose mt-14">
        <h2 className="text-xl font-semibold text-foreground">Capability comparison</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/60">
          Table 1 from the paper. Sudar + ALP compared with representative systems.
        </p>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-foreground/60">
          Cost column shows AI infrastructure only at 1,000 learners per month (Q1 2026).
        </p>
        <div className="mt-5 overflow-x-auto rounded-xl border border-white/10 bg-[#0a0a0a]">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3.5 font-medium text-slate-300">Feature</th>
                <th className="px-4 py-3.5 font-medium text-accent">Sudar + ALP</th>
                <th className="px-4 py-3.5 font-medium text-slate-400">Khanmigo</th>
                <th className="px-4 py-3.5 font-medium text-slate-400">LearnLM (Google)</th>
                <th className="px-4 py-3.5 font-medium text-slate-400">Typical LMS + AI</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr
                  key={row.feature}
                  className={`border-b border-white/5 ${i % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"}`}
                >
                  <td className="px-4 py-3.5 align-top font-medium text-foreground">{row.feature}</td>
                  <td className="px-4 py-3.5 align-top font-medium leading-relaxed text-accent">{row.sudar}</td>
                  <td className="px-4 py-3.5 align-top leading-relaxed text-slate-400">{row.khanmigo}</td>
                  <td className="px-4 py-3.5 align-top leading-relaxed text-slate-400">{row.learnlm}</td>
                  <td className="px-4 py-3.5 align-top leading-relaxed text-slate-400">{row.typicalLms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Cost table ────────────────────────────────────────────────────── */}
      <div className="not-prose mt-14">
        <h2 className="text-xl font-semibold text-foreground">
          Infrastructure cost at 1,000 learners / month
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/60">
          Table 3 from the paper. Empirically observed Q1 2026 pricing. AI infrastructure only;
          hosting costs excluded.
        </p>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-foreground/60">
          Supabase free tier: $0. Studio / Learn on Vercel free tier: $0. Intelligence on Railway /
          Render: about $5-$10/month at moderate traffic.
        </p>
        <div className="mt-5 overflow-x-auto rounded-xl border border-white/10 bg-[#0a0a0a]">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3.5 font-medium text-slate-300">Stack</th>
                <th className="px-4 py-3.5 text-right font-medium text-slate-300">Per learner / mo</th>
                <th className="px-4 py-3.5 text-right font-medium text-slate-300">Annual (1,000)</th>
              </tr>
            </thead>
            <tbody>
              {COST_ROWS.map((row, i) => (
                <tr
                  key={row.stack}
                  className={`border-b border-white/5 ${
                    row.highlight
                      ? "bg-accent/5"
                      : i % 2 === 0
                        ? "bg-transparent"
                        : "bg-white/[0.02]"
                  }`}
                >
                  <td
                    className={`px-4 py-3.5 align-top leading-relaxed ${
                      row.highlight ? "font-medium text-accent" : "text-slate-400"
                    }`}
                  >
                    {row.stack}
                  </td>
                  <td
                    className={`px-4 py-3.5 text-right align-top tabular-nums ${
                      row.highlight ? "font-semibold text-accent" : "text-slate-400"
                    }`}
                  >
                    {row.perMonth}
                  </td>
                  <td
                    className={`px-4 py-3.5 text-right align-top tabular-nums ${
                      row.highlight ? "font-semibold text-accent" : "text-slate-400"
                    }`}
                  >
                    {row.annual1k}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-slate-500">
          *Self-hosted ~$0 per API call after hardware provisioning; excludes amortised GPU hardware.
          Sudar achieves a{" "}
          <strong className="text-foreground/70">&gt;99% cost reduction</strong> relative to both
          proprietary AI stacks and incumbent LMS platform fees.
        </p>
      </div>

      {/* ── Cite this paper ───────────────────────────────────────────────── */}
      <h2 className="mt-14 text-xl font-semibold text-foreground">Cite this paper</h2>
      <p className="mt-2 text-sm text-foreground/60">
        When using Sudar or ALP in research or derivative work, please cite:
      </p>
      <div className="mt-4 rounded-xl border border-white/10 bg-[#0a0a0a] p-5">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-slate-500">BibTeX</p>
        <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-slate-300">
          {BIBTEX}
        </pre>
      </div>

      {/* ── APA inline ───────────────────────────────────────────────────── */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-slate-500">APA</p>
        <p className="text-sm leading-relaxed text-slate-300">
          Karunanithi, D. (2026).{" "}
          <em>
            Learning That Remembers You: An Open-Source AI-Native Learning Platform and Plugin
            Architecture for Longitudinal Learner Modelling at Scale.
          </em>{" "}
          Sudar / ALP Project. Apache-2.0 licence. Draft white paper —{" "}
          <span className="text-accent">contact author for PDF</span>.{" "}
          <span className="text-accent">https://github.com/Dhanikesh-Karunanithi/Sudar</span>
        </p>
      </div>

      {/* ── Reproducibility ───────────────────────────────────────────────── */}
      <h2 className="mt-14 text-xl font-semibold text-foreground">Reproducibility artefacts</h2>
      <p className="mt-2 text-sm text-foreground/60">
        All documents referenced in Appendix C of the paper are available in the repository:
      </p>
      <ul className="mt-4 space-y-2 text-sm text-foreground/70">
        {[
          ["docs/ALP_API.md", "ALP HTTP endpoint reference, field mappings, and integration examples"],
          ["docs/AGENTS_PLATFORM.md", "SudarAgents mission catalogue, tool catalogue, and security model"],
          ["docs/research/COST_WORKSHEET.md", "Versioned cost assumptions; fill and update at time of deployment"],
          ["docs/research/EVALUATION_APPENDIX.md", "Scope and limitations for each empirical claim"],
          ["docs/research/PILOT_PROTOCOL.md", "IRB-ready pilot study protocol"],
          ["scripts/benchmark-sudar.mjs", "Automated latency and token measurement script"],
          ["ECOSYSTEM.md", "Full schema, event model, and API surface"],
          ["RESEARCH_FOUNDATION.md", "Evidence-to-feature mapping (37 citations)"],
        ].map(([path, desc]) => (
          <li key={path} className="flex gap-2">
            <code className="mt-0.5 shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-xs text-slate-400">
              {path}
            </code>
            <span>{desc}</span>
          </li>
        ))}
      </ul>

      {/* ── Footer nav ────────────────────────────────────────────────────── */}
      <div className="mt-14 flex flex-wrap gap-4 border-t border-white/10 pt-8">
        <Link href="/research" className="text-accent hover:underline">
          Research Foundation →
        </Link>
        <Link href="/collaborate" className="text-accent hover:underline">
          Call for collaboration →
        </Link>
        <a
          href="https://github.com/Dhanikesh-Karunanithi/Sudar"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          GitHub Repository →
        </a>
      </div>
    </ProseSection>
  );
}

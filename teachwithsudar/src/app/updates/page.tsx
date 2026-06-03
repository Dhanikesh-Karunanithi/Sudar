import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";
import { GITHUB_URL } from "@/lib/site-nav";

export const metadata = {
  title: "Updates & Changelog",
};

const updates = [
  {
    date: "2026-05-24",
    title: "MCP for ChatGPT & creator tools",
    body: "Cloudflare remote MCP (mcp.thesudar.com), Studio Bearer routes, sudar_generate_* tools, MCP audit API, DEPLOY_THESUDAR_COM docs.",
    guide: "mcp-chatgpt-studio",
  },
  {
    date: "2026-05-22",
    title: "Sudar MCP package & remote worker",
    body: "@sudar/mcp-server with integrator, admin, and learner toolsets; Learn/Studio session Bearer support.",
    guide: "mcp-chatgpt-studio",
  },
  {
    date: "2026-05-22",
    title: "Notification sounds (Learn + Studio)",
    body: "Optional chimes for generation, tutor reply, toasts, celebrations; quiet hours; Studio course-ready chime on new course.",
    guide: "notification-sounds-and-engagement",
  },
  {
    date: "2026-05-13",
    title: "Localization (30+ locales)",
    body: "next-intl on Learn and Studio, learner language prefs, org default UI locale, multilingual TTS and tutor prompts.",
    guide: "localization-and-memory",
  },
  {
    date: "2026-05-13",
    title: "Tutor memory LLM cadence",
    body: "Learner and org controls for how often chat updates the profile; digest cron respects spacing.",
    guide: "localization-and-memory",
  },
  {
    date: "2026-04",
    title: "Personalization v2 & trust pack",
    body: "Enrollment overlays, consent, learner groups, Governance page, docs/trust documentation.",
    guide: "personalization-and-consent",
  },
  {
    date: "2026-04",
    title: "Proactive Sudar with choice chips",
    body: "Dashboard and course idle nudges; chip replies route to tutor query; ALP nudge shape documented.",
    guide: "learner-modalities-and-tutor",
  },
  {
    date: "2026-03",
    title: "Compliance email reminders",
    body: "Studio cron for at-risk and overdue path assignments via Resend.",
    guide: "compliance-paths",
  },
  {
    date: "2026-03",
    title: "SCORM 1.2 import",
    body: "Upload SCORM ZIP in Studio; Learn delivers via iframe proxy.",
    guide: "publish-to-learn",
  },
  {
    date: "2026-03",
    title: "Document-to-course & flashcards / Listen",
    body: "RAG generation from PDF/DOCX/URL; Cards and Listen modalities in Learn.",
    guide: "create-course-from-document",
  },
  {
    date: "2026-03",
    title: "ALP API & Moodle connector",
    body: "SudarMemory, SudarChat, SudarRecommend; docs/ALP_API.md.",
    guide: "alp-moodle-integration",
  },
  {
    date: "2026-02",
    title: "Production deployment docs",
    body: "VERCEL_DEPLOYMENT.md and INTELLIGENCE_DEPLOYMENT.md for Railway, Render, Fly.io.",
    guide: "self-host-production",
  },
];

export default function UpdatesPage() {
  return (
    <ProseSection title="Updates & Changelog" wide>
      <p className="text-lg text-foreground max-w-3xl">
        Product milestones for the open-source Sudar stack. Canonical detail lives in{" "}
        <a
          href={`${GITHUB_URL}/blob/main/docs/SHIPPED_FEATURES.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          docs/SHIPPED_FEATURES.md
        </a>{" "}
        and{" "}
        <a
          href={`${GITHUB_URL}/blob/main/UPDATES.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          UPDATES.md
        </a>
        .
      </p>

      <ul className="mt-10 space-y-4 list-none pl-0">
        {updates.map((u) => (
          <li key={u.date + u.title} className="rounded-xl border border-card-border bg-card-bg p-5 shadow-card">
            <time className="text-sm font-mono text-foreground-muted">{u.date}</time>
            <h3 className="mt-1 font-semibold text-foreground">{u.title}</h3>
            <p className="mt-2 text-foreground-muted">{u.body}</p>
            {u.guide ? (
              <Link href={`/guides/${u.guide}`} className="mt-3 inline-block text-sm text-primary hover:underline font-medium">
                Related walkthrough →
              </Link>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/guides" className="text-primary hover:underline font-medium">
          Guides →
        </Link>
        <Link href="/features" className="text-primary hover:underline font-medium">
          Features →
        </Link>
        <Link href="/roadmap" className="text-primary hover:underline font-medium">
          Roadmap →
        </Link>
      </div>
    </ProseSection>
  );
}

export type CapabilitySurface = "studio" | "learn" | "intelligence" | "integrations";

export type PlatformCapability = {
  id: string;
  surface: CapabilitySurface;
  title: string;
  summary: string;
  details: string[];
  guideSlug?: string;
  docPath?: string;
};

export const capabilitySurfaces: Record<
  CapabilitySurface,
  { label: string; description: string }
> = {
  studio: {
    label: "Sudar Studio",
    description: "Authoring, paths, analytics, governance, and integrations for L&D teams.",
  },
  learn: {
    label: "Sudar Learn",
    description: "Learner delivery, modalities, tutor, memory, gamification, and search.",
  },
  intelligence: {
    label: "Sudar Intelligence",
    description: "Adaptive engine, TTS, generation, and tutor backends (Python FastAPI).",
  },
  integrations: {
    label: "ALP & MCP",
    description: "Plugins for Moodle and other LMSs; MCP for Cursor, ChatGPT, and partners.",
  },
};

export const platformCapabilities: PlatformCapability[] = [
  {
    id: "doc-to-course",
    surface: "studio",
    title: "Document & URL to course",
    summary: "Upload PDF/DOCX or paste a URL; AI drafts outline and modules with RAG over your sources.",
    details: [
      "Block-based editor with live preview",
      "14 visual personas / templates",
      "Fact-checking and content moderation hooks",
    ],
    guideSlug: "create-course-from-document",
    docPath: "docs/SHIPPED_FEATURES.md",
  },
  {
    id: "scorm-import",
    surface: "studio",
    title: "SCORM 1.2 import & export",
    summary: "Import packaged e-learning; export SCORM or publish directly to Learn.",
    details: ["Parse imsmanifest.xml into Sudar modules", "Learn delivers via iframe proxy with correct MIME types"],
    guideSlug: "publish-to-learn",
  },
  {
    id: "learning-paths",
    surface: "studio",
    title: "Learning paths & compliance",
    summary: "Ordered paths, mandatory courses, due dates, and compliance views.",
    details: [
      "At-risk / overdue tracking",
      "Compliance email reminders (cron + Resend)",
      "Certificates on path completion",
    ],
    guideSlug: "compliance-paths",
    docPath: "docs/SHIPPED_FEATURES.md",
  },
  {
    id: "personalization-v2",
    surface: "studio",
    title: "Personalization & governance",
    summary: "Org policy for AI overlays, learner groups, consent, and trust documentation links.",
    details: [
      "Module overlays stored on enrollments (canonical content unchanged)",
      "Governance page links to docs/trust pack",
      "Learner group targeting for personalization audience",
    ],
    guideSlug: "personalization-and-consent",
  },
  {
    id: "studio-localization",
    surface: "studio",
    title: "Localization (org defaults)",
    summary: "Studio UI locales and org default learner UI language in settings.",
    details: ["next-intl catalogs", "Org localization card", "Optional Together AI course covers on create"],
    guideSlug: "localization-and-memory",
  },
  {
    id: "studio-integrations",
    surface: "studio",
    title: "Integrations & MCP",
    summary: "ALP API keys, embed Sudar, ChatGPT connector URL, and MCP audit logging.",
    details: [
      "Bearer auth on creator API routes",
      "POST /api/mcp/audit for tool telemetry",
      "Cursor mcp.json snippet on Integrations page",
    ],
    guideSlug: "mcp-chatgpt-studio",
    docPath: "docs/MCP_SERVERS.md",
  },
  {
    id: "modalities",
    surface: "learn",
    title: "Seven learning modalities",
    summary: "One authored course; learners switch Read, Listen, Watch, Map, Cards, Feed, Play.",
    details: [
      "On-demand TTS (Edge-TTS / Sarvam via Intelligence)",
      "AI flashcards and mind maps from module content",
      "SudarVid / Remotion for generated video",
    ],
    guideSlug: "learner-modalities-and-tutor",
  },
  {
    id: "tutor-memory",
    surface: "learn",
    title: "Tutor Sudar & longitudinal memory",
    summary: "RAG over course content, session memory, proactive nudges, and governed LLM cadence.",
    details: [
      "Floating chat + in-course tutor",
      "Proactive choice chips on dashboard and idle nudges in courses",
      "My Memory: digest cadence and tutor memory preferences",
    ],
    guideSlug: "learner-modalities-and-tutor",
    docPath: "docs/sudar-memory.md",
  },
  {
    id: "personalization-learn",
    surface: "learn",
    title: "Learner personalization overlays",
    summary: "Role explain and brief views per module when org policy and consent allow.",
    details: ["Overlays on enrollment only", "Generative AI consent when required by org"],
    guideSlug: "personalization-and-consent",
  },
  {
    id: "gamification",
    surface: "learn",
    title: "Gamification & engagement",
    summary: "Quests, check-ins, coins, achievements, and in-app notifications.",
    details: ["Structured learning_events for milestones", "Dashboard toasts for level-ups"],
    guideSlug: "notification-sounds-and-engagement",
  },
  {
    id: "notification-sounds",
    surface: "learn",
    title: "Notification sounds",
    summary: "Optional chimes for generation complete, tutor reply, toasts, and celebrations.",
    details: [
      "Settings → Notification controls",
      "Quiet hours and prefers-reduced-motion respected",
      "Studio: chime when AI course generation finishes",
    ],
    guideSlug: "notification-sounds-and-engagement",
  },
  {
    id: "learn-search",
    surface: "learn",
    title: "Global search",
    summary: "Discover courses and paths from the learner dashboard search entry point.",
    details: ["Server-backed search routes under /search"],
  },
  {
    id: "learn-i18n",
    surface: "learn",
    title: "30+ UI locales & multilingual TTS",
    summary: "Cookie-driven UI language, content language prefs, RTL fonts, and localized tutor prompts.",
    details: ["Memory → language preferences", "Org default UI locale from Studio when unset"],
    guideSlug: "localization-and-memory",
  },
  {
    id: "adaptive-engine",
    surface: "intelligence",
    title: "Digital Learner Twin & NBA",
    summary: "Event ingestion updates profiles; next-best-action and modality recommendations.",
    details: ["FastAPI adaptive routes", "Modality dispatcher and skill gap mapping"],
  },
  {
    id: "generation",
    surface: "intelligence",
    title: "Multi-format generation",
    summary: "Course content, audio, images (Together), with provider fallback chains.",
    details: ["Together / OpenAI / Anthropic where configured", "Edge-TTS and Sarvam for Listen"],
  },
  {
    id: "alp-plugins",
    surface: "integrations",
    title: "ALP for existing LMSs",
    summary: "SudarMemory, SudarChat, SudarRecommend for Moodle; API for Canvas and others.",
    details: ["POST /api/alp/events, tutor/query, next-action", "x-alp-api-key from Studio Integrations"],
    guideSlug: "alp-moodle-integration",
    docPath: "docs/ALP_API.md",
  },
  {
    id: "mcp-remote",
    surface: "integrations",
    title: "Sudar MCP (Cursor & ChatGPT)",
    summary: "stdio package, Cloudflare remote OAuth worker, creator tools for course generation.",
    details: [
      "@sudar/mcp-server on npm",
      "mcp.thesudar.com for ChatGPT connector",
      "Toolsets: integrator, creator, admin, learner",
    ],
    guideSlug: "mcp-chatgpt-studio",
    docPath: "docs/MCP_CHATGPT_LAUNCH.md",
  },
];

export function capabilitiesBySurface(surface: CapabilitySurface): PlatformCapability[] {
  return platformCapabilities.filter((c) => c.surface === surface);
}

export function getCapability(id: string): PlatformCapability | undefined {
  return platformCapabilities.find((c) => c.id === id);
}

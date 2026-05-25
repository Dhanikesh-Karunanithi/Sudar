export type BestPractice = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  guideSlug?: string;
  helpSlug?: string;
};

export const bestPracticeGroups: { title: string; practices: BestPractice[] }[] = [
  {
    title: "Course design (Studio)",
    practices: [
      {
        id: "source-quality",
        title: "Start with a clean source",
        summary: "Better inputs produce better outlines.",
        bullets: [
          "Use a well-structured PDF or article URL rather than a loose paste when possible.",
          "Review the generated outline before publishing; adjust module order to match your compliance story.",
          "Add one quiz per module so struggle signals feed the learner profile.",
        ],
        guideSlug: "create-course-from-document",
        helpSlug: "admins/studio-overview",
      },
      {
        id: "media-and-templates",
        title: "Templates and media search",
        summary: "Keep visual consistency without a design team.",
        bullets: [
          "Pick a persona/template early and stay on it for the path.",
          "Use in-editor media search (Pexels, Unsplash, etc.) for royalty-safe assets.",
          "Enable the Studio chime on long AI generations so creators know when a draft is ready.",
        ],
        guideSlug: "create-course-from-document",
      },
    ],
  },
  {
    title: "Delivery (Learn)",
    practices: [
      {
        id: "modality-choice",
        title: "Let learners switch modalities",
        summary: "Same module, different channel.",
        bullets: [
          "Tell learners they can use Listen on mobile and Read at a desk.",
          "Encourage Cards after a dense Read module for retrieval practice.",
          "Point people to the tutor for “explain this” on selected text.",
        ],
        guideSlug: "learner-modalities-and-tutor",
        helpSlug: "learners/modalities",
      },
      {
        id: "tutor-habits",
        title: "Build tutor memory deliberately",
        summary: "Memory improves when learners interact over time.",
        bullets: [
          "Use follow-up questions in the tutor so session context accumulates.",
          "Set digest cadence on Memory if your org allows LLM profile updates.",
          "Respect org policy: some tenants require consent before overlays or inference.",
        ],
        guideSlug: "localization-and-memory",
        helpSlug: "learners/tutor-and-memory",
      },
    ],
  },
  {
    title: "Paths, compliance, and ALP",
    practices: [
      {
        id: "paths",
        title: "Paths and due dates",
        summary: "Make mandatory training measurable.",
        bullets: [
          "Separate mandatory and optional courses on a path.",
          "Schedule the compliance-reminders cron with CRON_SECRET and Resend configured.",
          "Use analytics drop-off views to fix modules where everyone stalls.",
        ],
        guideSlug: "compliance-paths",
        helpSlug: "success/pilot-checklist",
      },
      {
        id: "alp-keys",
        title: "ALP integration hygiene",
        summary: "Stable identity and batched events.",
        bullets: [
          "Map LMS user IDs to Sudar profiles.id once and keep the mapping stable.",
          "Rotate ALP keys from Studio Integrations if a connector is compromised.",
          "Batch events at session end where the LMS allows it.",
        ],
        guideSlug: "alp-moodle-integration",
        helpSlug: "admins/integrations-overview",
      },
    ],
  },
  {
    title: "Operations and trust",
    practices: [
      {
        id: "deploy",
        title: "Production checklist",
        summary: "Studio, Learn, Intelligence, and DNS.",
        bullets: [
          "Apply database migrations before first learner login.",
          "Set SUDAR_INTELLIGENCE_URL and INTELLIGENCE_SERVICE_SECRET on both Vercel projects.",
          "Read docs/trust before procurement reviews; link Governance in Studio.",
        ],
        guideSlug: "self-host-production",
        helpSlug: "start-here/getting-started",
      },
      {
        id: "mcp-governance",
        title: "MCP and external AI clients",
        summary: "Creator tools still obey your tenant auth.",
        bullets: [
          "Use OAuth MCP for ChatGPT; use short-lived tokens for local Cursor configs.",
          "Audit MCP tool calls via /api/mcp/audit when you need operator trails.",
          "Do not paste service role keys into MCP client env files.",
        ],
        guideSlug: "mcp-chatgpt-studio",
        helpSlug: "ai-literacy/sudar-agents-for-admins",
      },
    ],
  },
];

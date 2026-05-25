import type { WireframeSceneId } from "@/components/wireframes/WireframeScenes";

export type TutorialAudience = "admin" | "learner" | "operator";

export type TutorialStep = {
  title: string;
  body: string;
  scene: WireframeSceneId;
  callout?: string;
};

export type Tutorial = {
  slug: string;
  title: string;
  excerpt: string;
  audience: TutorialAudience;
  duration: string;
  surfaces: ("studio" | "learn" | "intelligence" | "integrations")[];
  steps: TutorialStep[];
  relatedHelp?: string[];
  relatedCapabilities?: string[];
};

export const tutorials: Tutorial[] = [
  {
    slug: "create-course-from-document",
    title: "Create a course from a document or URL",
    excerpt:
      "Walk through Sudar Studio: source input, AI outline, edit modules, and prepare to publish.",
    audience: "admin",
    duration: "10–15 min",
    surfaces: ["studio", "intelligence"],
    relatedCapabilities: ["doc-to-course"],
    relatedHelp: ["admins/studio-overview", "ai-literacy/what-sudar-uses-ai-for"],
    steps: [
      {
        title: "Open Studio and start a new course",
        body: "From the dashboard, choose New course. Pick Create from document, URL, or prompt.",
        scene: "studio-dashboard",
        callout: "Courses · Paths · Analytics in the sidebar",
      },
      {
        title: "Add your source material",
        body: "Upload PDF/DOCX or paste a link. Intelligence extracts text and Studio runs the generation pipeline.",
        scene: "studio-new-course",
        callout: "RAG uses uploaded docs when configured",
      },
      {
        title: "Review the AI outline",
        body: "Edit module titles, reorder sections, and adjust copy in the block editor before publishing.",
        scene: "studio-editor",
        callout: "Switch visual persona without losing content",
      },
    ],
  },
  {
    slug: "publish-to-learn",
    title: "Publish to Learn (and optional SCORM)",
    excerpt: "Publish a course to your learners, or export SCORM 1.2 for another LMS.",
    audience: "admin",
    duration: "5 min",
    surfaces: ["studio", "learn"],
    relatedCapabilities: ["scorm-import", "doc-to-course"],
    relatedHelp: ["admins/studio-overview", "learners/scorm-modules"],
    steps: [
      {
        title: "Finish edits in Studio",
        body: "Confirm modules, media, and quizzes. Run a quick preview if your team uses review workflows.",
        scene: "studio-editor",
      },
      {
        title: "Publish to Sudar Learn",
        body: "One click makes the course available to enrolled learners. Assign via paths or direct enrollment.",
        scene: "studio-dashboard",
        callout: "Set NEXT_PUBLIC_LEARN_APP_URL in Studio env",
      },
      {
        title: "Learner opens the course",
        body: "In Learn, the course viewer loads modules with modality tabs and the tutor launcher.",
        scene: "learn-course-viewer",
      },
    ],
  },
  {
    slug: "learner-modalities-and-tutor",
    title: "Learner modalities and tutor Sudar",
    excerpt:
      "How learners switch formats, ask the tutor, and get proactive help without leaving the course.",
    audience: "learner",
    duration: "8 min",
    surfaces: ["learn", "intelligence"],
    relatedCapabilities: ["modalities", "tutor-memory"],
    relatedHelp: ["learners/modalities", "learners/tutor-and-memory"],
    steps: [
      {
        title: "Dashboard and enrollments",
        body: "Learners see assigned courses, paths, streak, and Sudar recommendations on the home screen.",
        scene: "learn-dashboard",
      },
      {
        title: "Choose a modality per module",
        body: "Read, Listen, Watch, Map, or Cards: same module content, different presentation.",
        scene: "learn-course-viewer",
        callout: "Listen uses on-demand TTS via Intelligence",
      },
      {
        title: "Ask Sudar or accept a nudge",
        body: "Open the floating tutor for Q&A, or tap proactive chips when Sudar offers a next step.",
        scene: "learn-tutor",
        callout: "RAG is scoped to published course chunks",
      },
    ],
  },
  {
    slug: "personalization-and-consent",
    title: "Personalization overlays and consent",
    excerpt:
      "Org policy in Studio, learner consent in Learn, and per-module overlays that never overwrite canonical content.",
    audience: "admin",
    duration: "12 min",
    surfaces: ["studio", "learn"],
    relatedCapabilities: ["personalization-v2", "personalization-learn"],
    relatedHelp: ["ai-literacy/governance-and-privacy", "trust/overview"],
    steps: [
      {
        title: "Configure org AI policy",
        body: "Studio → Org settings: enable personalization features, audience (org / groups / individuals), and consent rules.",
        scene: "studio-settings",
      },
      {
        title: "Learner accepts consent when required",
        body: "If the org requires it, learners accept generative personalization before overlays generate.",
        scene: "learn-dashboard",
      },
      {
        title: "Request a module overlay",
        body: "Eligible learners can request role explain or brief views; results live on the enrollment record only.",
        scene: "learn-course-viewer",
        callout: "modules.content is never overwritten",
      },
    ],
  },
  {
    slug: "alp-moodle-integration",
    title: "Connect Moodle with ALP",
    excerpt: "API keys, event ingestion, embedded tutor, and next-action blocks on the LMS dashboard.",
    audience: "operator",
    duration: "20 min",
    surfaces: ["integrations", "learn", "studio"],
    relatedCapabilities: ["alp-plugins"],
    relatedHelp: ["admins/integrations-overview"],
    steps: [
      {
        title: "Create an ALP API key in Studio",
        body: "Integrations → generate key. Note your Learn base URL for Moodle plugin configuration.",
        scene: "studio-integrations",
      },
      {
        title: "SudarMemory sends learning events",
        body: "Moodle posts completions, attempts, and time-on-task to POST /api/alp/events.",
        scene: "alp-flow",
        callout: "Map LMS user IDs to Sudar profiles.id consistently",
      },
      {
        title: "SudarChat and SudarRecommend in Moodle",
        body: "Embed the tutor block and show next-best-action cards without replacing Moodle entirely.",
        scene: "learn-tutor",
      },
    ],
  },
  {
    slug: "mcp-chatgpt-studio",
    title: "Connect ChatGPT or Cursor via MCP",
    excerpt:
      "Use Sudar creator tools from AI clients: outlines, quizzes, and course creation against your Studio tenant.",
    audience: "admin",
    duration: "15 min",
    surfaces: ["integrations", "studio"],
    relatedCapabilities: ["mcp-remote", "studio-integrations"],
    relatedHelp: ["admins/integrations-overview", "ai-literacy/sudar-agents-for-admins"],
    steps: [
      {
        title: "Open Integrations in Studio",
        body: "Copy the MCP URL, OAuth connector instructions, or Cursor mcp.json snippet.",
        scene: "studio-integrations",
      },
      {
        title: "Authenticate the MCP client",
        body: "ChatGPT uses the Cloudflare worker at mcp.thesudar.app; Cursor uses stdio with your session token.",
        scene: "studio-integrations",
        callout: "See docs/MCP_CHATGPT_LAUNCH.md in the repo",
      },
      {
        title: "Run creator tools",
        body: "Tools like sudar_generate_outline and sudar_create_course proxy Studio with Bearer JWT and audit logging.",
        scene: "studio-new-course",
      },
    ],
  },
  {
    slug: "notification-sounds-and-engagement",
    title: "Notification sounds and engagement loop",
    excerpt:
      "Optional chimes in Learn, Studio generation feedback, plus quests, coins, and achievements.",
    audience: "learner",
    duration: "6 min",
    surfaces: ["learn", "studio"],
    relatedCapabilities: ["notification-sounds", "gamification"],
    steps: [
      {
        title: "Learner sound preferences",
        body: "Settings → Notification controls: master toggle, volume, and per-event groups. Quiet hours apply.",
        scene: "learn-settings",
      },
      {
        title: "Chimes during learning",
        body: "Task complete, tutor reply, notification toast, and celebration sounds respect prefs and reduced motion.",
        scene: "learn-course-viewer",
      },
      {
        title: "Studio course-ready chime",
        body: "On New course, creators can enable a local chime when AI generation finishes (alongside browser notifications).",
        scene: "studio-new-course",
      },
    ],
  },
  {
    slug: "localization-and-memory",
    title: "Languages, tutor memory cadence, and digests",
    excerpt:
      "UI and content language prefs, org defaults, and governed LLM updates to the learner profile.",
    audience: "learner",
    duration: "10 min",
    surfaces: ["learn", "studio", "intelligence"],
    relatedCapabilities: ["learn-i18n", "studio-localization", "tutor-memory"],
    relatedHelp: ["learners/tutor-and-memory"],
    steps: [
      {
        title: "Set languages on Memory",
        body: "Learners choose UI language, content language, and optional auto-detect. Tutor and TTS follow content language.",
        scene: "learn-memory",
      },
      {
        title: "Org default in Studio",
        body: "Admins set default UI locale for learners who have not customized preferences.",
        scene: "studio-settings",
      },
      {
        title: "Govern tutor memory cadence",
        body: "Learners throttle LLM profile inference; orgs can disable or set minimum intervals and digest spacing.",
        scene: "learn-memory",
        callout: "consolidate-learner-memory cron respects cadence",
      },
    ],
  },
  {
    slug: "compliance-paths",
    title: "Compliance paths and reminders",
    excerpt: "Mandatory sequences, due dates, at-risk views, and scheduled email reminders.",
    audience: "admin",
    duration: "12 min",
    surfaces: ["studio"],
    relatedCapabilities: ["learning-paths"],
    steps: [
      {
        title: "Build a learning path",
        body: "Add courses in order, mark mandatory vs optional, and assign teams or individuals.",
        scene: "studio-dashboard",
      },
      {
        title: "Set due dates",
        body: "Path enrollments carry due dates used by compliance dashboards and reminder jobs.",
        scene: "studio-dashboard",
        callout: "Optional courses can reorder adaptively per learner",
      },
      {
        title: "Schedule compliance reminders",
        body: "Call POST /api/cron/compliance-reminders daily with CRON_SECRET; Resend delivers at-risk and overdue emails.",
        scene: "studio-settings",
      },
    ],
  },
  {
    slug: "self-host-production",
    title: "Self-host and production deploy",
    excerpt:
      "Two Vercel projects, Intelligence on Railway/Render/Fly, a Postgres database you operate, and thesudar.app DNS when ready.",
    audience: "operator",
    duration: "30+ min",
    surfaces: ["studio", "learn", "intelligence", "integrations"],
    relatedHelp: ["start-here/getting-started", "trust/overview"],
    steps: [
      {
        title: "Database and migrations",
        body: "Provision Postgres, apply the repo migrations, and copy connection credentials from .env.example.",
        scene: "studio-dashboard",
        callout: "docs/VERCEL_DEPLOYMENT.md",
      },
      {
        title: "Deploy Studio and Learn",
        body: "Import the repo twice on Vercel with roots sudar-studio and sudar-learn. Set shared database env vars from .env.example.",
        scene: "studio-dashboard",
      },
      {
        title: "Deploy Intelligence and MCP",
        body: "Host sudar-intelligence, set SUDAR_INTELLIGENCE_URL, then optional mcp.thesudar.app worker per DEPLOY_THESUDAR_APP.md.",
        scene: "studio-integrations",
      },
    ],
  },
];

export function getTutorial(slug: string): Tutorial | undefined {
  return tutorials.find((t) => t.slug === slug);
}

export function getAllTutorialSlugs(): string[] {
  return tutorials.map((t) => t.slug);
}

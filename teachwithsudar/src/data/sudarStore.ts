import { GITHUB_URL, STUDIO_APP_URL } from "@/lib/site-nav";

export type StoreCategory = "intelligence" | "create" | "connector" | "developer";
export type StoreLms = "moodle" | "canvas" | "blackboard" | "lti" | "any";
export type StoreStatus = "available" | "pilot" | "coming-soon";
export type StoreInstallType = "download" | "lti" | "api" | "embed" | "mcp";

export interface SudarStoreItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: StoreCategory;
  lms: StoreLms[];
  status: StoreStatus;
  installTypes: StoreInstallType[];
  features: string[];
  apiEndpoint?: string;
  docsPath?: string;
  githubPath?: string;
  downloadPath?: string;
  studioPath?: string;
  badge?: string;
}

export const STORE_CATEGORIES: { id: StoreCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "intelligence", label: "Learner intelligence" },
  { id: "create", label: "Content creation" },
  { id: "connector", label: "LMS connectors" },
  { id: "developer", label: "Developer tools" },
];

export const STORE_LMS_FILTERS: { id: StoreLms | "all"; label: string }[] = [
  { id: "all", label: "All LMS" },
  { id: "moodle", label: "Moodle" },
  { id: "canvas", label: "Canvas" },
  { id: "blackboard", label: "Blackboard" },
  { id: "lti", label: "LTI 1.3" },
  { id: "any", label: "Any LMS (API)" },
];

export const SUDAR_STORE_ITEMS: SudarStoreItem[] = [
  {
    id: "sudar-memory",
    name: "SudarMemory",
    tagline: "Longitudinal learner telemetry for your LMS",
    description:
      "Forwards completions, quiz attempts, and activity signals from Moodle (or xAPI/LRS) into Sudar's Digital Learner Twin via POST /api/alp/events.",
    category: "intelligence",
    lms: ["moodle", "canvas", "blackboard", "lti", "any"],
    status: "pilot",
    installTypes: ["download", "api"],
    features: ["xAPI & SCORM event mapping", "Org-scoped API keys", "Queue retry with DLQ (Moodle)"],
    apiEndpoint: "POST /api/alp/events",
    docsPath: `${GITHUB_URL}/blob/main/docs/ALP_API.md`,
    githubPath: `${GITHUB_URL}/tree/main/integrations/moodle/local_sudaralp`,
    downloadPath: `${GITHUB_URL}/tree/main/integrations/moodle/local_sudaralp`,
    studioPath: `${STUDIO_APP_URL}/integrations`,
    badge: "ALP",
  },
  {
    id: "sudar-chat",
    name: "SudarChat",
    tagline: "Memory-aware AI tutor inside your LMS",
    description:
      "Embeds Sudar tutor chat in Moodle blocks or LTI iframes. Uses learner Twin context and course RAG for grounded answers.",
    category: "intelligence",
    lms: ["moodle", "canvas", "blackboard", "lti"],
    status: "pilot",
    installTypes: ["download", "lti", "embed", "api"],
    features: ["Proactive nudges", "Longitudinal memory", "Embed token flow"],
    apiEndpoint: "POST /api/alp/tutor/query",
    docsPath: `${GITHUB_URL}/blob/main/docs/ALP_API.md`,
    githubPath: `${GITHUB_URL}/blob/main/integrations/moodle/local_sudaralp/tutor.php`,
    downloadPath: `${GITHUB_URL}/tree/main/integrations/moodle/local_sudaralp`,
    studioPath: `${STUDIO_APP_URL}/integrations`,
    badge: "ALP",
  },
  {
    id: "sudar-recommend",
    name: "SudarRecommend",
    tagline: "Next-best-action on the LMS dashboard",
    description:
      "Shows Sudar's adaptive recommendation card on Moodle dashboard or course home — continue course, try modality, review skill.",
    category: "intelligence",
    lms: ["moodle", "canvas", "lti"],
    status: "pilot",
    installTypes: ["download", "api"],
    features: ["Twin-powered scoring", "No LMS schema changes", "Dashboard block"],
    apiEndpoint: "POST /api/alp/next-action",
    docsPath: `${GITHUB_URL}/blob/main/docs/ALP_API.md`,
    githubPath: `${GITHUB_URL}/blob/main/integrations/moodle/local_sudaralp/nextaction.php`,
    downloadPath: `${GITHUB_URL}/tree/main/integrations/moodle/local_sudaralp`,
    badge: "ALP",
  },
  {
    id: "sudar-quiz",
    name: "SudarQuiz",
    tagline: "AI quiz generator with SCORM export",
    description:
      "Paste lesson text → get MCQ questions with explanations. Export as JSON or SCORM 1.2 ZIP for upload into any LMS.",
    category: "create",
    lms: ["moodle", "canvas", "blackboard", "lti", "any"],
    status: "pilot",
    installTypes: ["lti", "embed", "api"],
    features: ["Topic-tagged questions", "SCORM 1.2 single-SCO", "Org AI metering"],
    apiEndpoint: "POST /api/alp/create/quiz",
    docsPath: `${GITHUB_URL}/blob/main/docs/SUDAR_CREATE_API.md`,
    githubPath: `${GITHUB_URL}/tree/main/sudar-learn/src/app/api/alp/create/quiz`,
    studioPath: `${STUDIO_APP_URL}/integrations`,
    badge: "Create",
  },
  {
    id: "sudar-interact",
    name: "SudarInteract",
    tagline: "Genially-style interactives from text",
    description:
      "Generate timeline, matching, tabs, hotspot, and flipcard blocks. Preview in Sudar Create and export SCORM for LMS upload.",
    category: "create",
    lms: ["moodle", "canvas", "lti", "any"],
    status: "pilot",
    installTypes: ["lti", "embed", "api"],
    features: ["Multiple component types", "SCORM export", "Component selector AI"],
    apiEndpoint: "POST /api/alp/create/interactive",
    docsPath: `${GITHUB_URL}/blob/main/docs/SUDAR_CREATE_API.md`,
    badge: "Create",
  },
  {
    id: "sudar-cards",
    name: "SudarCards",
    tagline: "Flashcard decks from module content",
    description:
      "Extract 4–8 study pairs from text. Export SCORM or embed flashcard activity in your LMS.",
    category: "create",
    lms: ["moodle", "canvas", "lti", "any"],
    status: "pilot",
    installTypes: ["lti", "embed", "api"],
    features: ["Front/back pairs", "SCORM deck player", "Multilingual support"],
    apiEndpoint: "POST /api/alp/create/flashcards",
    docsPath: `${GITHUB_URL}/blob/main/docs/SUDAR_CREATE_API.md`,
    badge: "Create",
  },
  {
    id: "sudar-draft",
    name: "SudarDraft",
    tagline: "Document → course outline (async)",
    description:
      "Submit document text or URL; poll job status for module outline. Optional SCORM timeline export for LMS import.",
    category: "create",
    lms: ["moodle", "canvas", "lti", "any"],
    status: "pilot",
    installTypes: ["lti", "api"],
    features: ["Async job queue", "Webhook on complete", "Outline → SCORM"],
    apiEndpoint: "POST /api/alp/create/from-document",
    docsPath: `${GITHUB_URL}/blob/main/docs/SUDAR_CREATE_API.md`,
    badge: "Create",
  },
  {
    id: "sudar-media",
    name: "SudarMedia",
    tagline: "Podcast & video generation jobs",
    description:
      "Queue media generation from module text. Connect SudarVid and Studio podcast routes for full MP3/MP4 in production.",
    category: "create",
    lms: ["moodle", "canvas", "lti", "any"],
    status: "pilot",
    installTypes: ["lti", "api"],
    features: ["Async jobs", "Webhook HMAC", "SudarVid-ready"],
    apiEndpoint: "POST /api/alp/create/media",
    docsPath: `${GITHUB_URL}/blob/main/docs/SUDAR_CREATE_API.md`,
    badge: "Create",
  },
  {
    id: "sudar-sim",
    name: "SudarSim",
    tagline: "Real-time roleplay with AI coach feedback",
    description:
      "Multi-channel simulations (phone, chat, email) with screenshot CRM overlays, rubric coaching, and learner Twin integration. Launch from Learn, /sim, or Moodle LTI embed.",
    category: "create",
    lms: ["moodle", "canvas", "lti", "any"],
    status: "pilot",
    installTypes: ["lti", "embed", "api"],
    features: [
      "Voice + chat + email tabs",
      "Screenshot CRM overlay editor",
      "Transcript → scenario import",
      "Rubric coach + replay moments",
    ],
    apiEndpoint: "POST /api/sim/session",
    docsPath: `${GITHUB_URL}/blob/main/docs/SUDAR_SIM_API.md`,
    githubPath: `${GITHUB_URL}/tree/main/sudar-sim`,
    downloadPath: `${GITHUB_URL}/tree/main/integrations/moodle/local_sudaralp/sim.php`,
    badge: "Sim",
  },
  {
    id: "sudar-create-suite",
    name: "Sudar Create Suite",
    tagline: "All creation tools in one LTI embed",
    description:
      "Single teacher iframe at /alp/create with quiz, interactives, flashcards, outline, draft, and media tools. Get embed token from your LMS backend.",
    category: "create",
    lms: ["moodle", "canvas", "lti"],
    status: "pilot",
    installTypes: ["lti", "embed"],
    features: ["Tool picker UI", "SCORM download", "Create embed token"],
    apiEndpoint: "POST /api/alp/create/embed-token",
    docsPath: `${GITHUB_URL}/blob/main/docs/SUDAR_CREATE_API.md`,
    githubPath: `${GITHUB_URL}/blob/main/sudar-learn/src/app/alp/create`,
    downloadPath: `${GITHUB_URL}/blob/main/integrations/moodle/local_sudaralp/create.php`,
    badge: "Create",
  },
  {
    id: "moodle-alp-connector",
    name: "Moodle ALP Connector",
    tagline: "local_sudaralp + block plugin bundle",
    description:
      "Installable Moodle 4.x plugins: SudarMemory event queue, SudarChat tutor, SudarRecommend block, and Sudar Create launcher.",
    category: "connector",
    lms: ["moodle"],
    status: "pilot",
    installTypes: ["download"],
    features: ["Identity resolve cache", "Fail-closed events option", "Admin settings page"],
    docsPath: `${GITHUB_URL}/blob/main/integrations/moodle/local_sudaralp/README.md`,
    githubPath: `${GITHUB_URL}/tree/main/integrations/moodle`,
    downloadPath: `${GITHUB_URL}/tree/main/integrations/moodle`,
    studioPath: `${STUDIO_APP_URL}/integrations`,
    badge: "Moodle",
  },
  {
    id: "canvas-lti-pack",
    name: "Canvas LTI Pack",
    tagline: "LTI 1.3 config checklist for Canvas",
    description:
      "Register Sudar as an external tool: JWKS, launch URL, deep linking for Create, and identity mapping guide.",
    category: "connector",
    lms: ["canvas", "lti"],
    status: "pilot",
    installTypes: ["lti", "download"],
    features: ["lti-config.json template", "Create deep link", "Grade passback roadmap"],
    docsPath: `${GITHUB_URL}/blob/main/integrations/canvas/README.md`,
    githubPath: `${GITHUB_URL}/tree/main/integrations/canvas`,
    downloadPath: `${GITHUB_URL}/blob/main/integrations/canvas/lti-config.json`,
    badge: "Canvas",
  },
  {
    id: "mcp-integrator",
    name: "Sudar MCP Server",
    tagline: "Connect AI agents to ALP & Create APIs",
    description:
      "Model Context Protocol tools for sudar_create_quiz, sudar_tutor_query, sudar_next_best_action, and more — same contracts as LMS backends.",
    category: "developer",
    lms: ["any"],
    status: "available",
    installTypes: ["mcp", "api"],
    features: ["Integrator toolset", "ALP key auth", "Cloudflare worker discovery"],
    docsPath: `${GITHUB_URL}/blob/main/docs/MCP_SERVERS.md`,
    githubPath: `${GITHUB_URL}/tree/main/packages/sudar-mcp`,
    badge: "MCP",
  },
  {
    id: "alp-sdk",
    name: "ALP TypeScript SDK",
    tagline: "Starter client for custom LMS glue",
    description:
      "Minimal TypeScript client for events, tutor, next-action, identity resolve, and Sudar Create endpoints.",
    category: "developer",
    lms: ["any"],
    status: "available",
    installTypes: ["api"],
    features: ["Typed requests", "API key header", "Create methods included"],
    docsPath: `${GITHUB_URL}/blob/main/docs/ALP_API.md`,
    githubPath: `${GITHUB_URL}/tree/main/integrations/alp-sdk`,
    badge: "SDK",
  },
];

export function getStoreItem(id: string): SudarStoreItem | undefined {
  return SUDAR_STORE_ITEMS.find((item) => item.id === id);
}

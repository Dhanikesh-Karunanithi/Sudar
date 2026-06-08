export function buildMcpLlmsTxt(base: string): string {
  return `# Sudar MCP Server

> Model Context Protocol endpoint for AI agents to interact with Sudar — the forever-free, open AI-powered Learning Operating System.

## Endpoints

- **MCP (Streamable HTTP):** ${base}/mcp
- **OAuth discovery:** ${base}/.well-known/oauth-authorization-server
- **Health:** ${base}/health
- **Platform llms.txt:** https://teachwithsudar.com/llms.txt

## Authentication

1. **OAuth (ChatGPT / Claude connectors):** Use OAuth discovery at \`${base}/.well-known/oauth-authorization-server\`. Authorize via Sudar Studio login, then exchange token at \`${base}/oauth/token\`.
2. **Bearer JWT:** Pass a Supabase access token as \`Authorization: Bearer <token>\` for creator, admin, and learner toolsets.
3. **ALP API key:** Pass \`x-alp-api-key\` header for integrator toolsets (LMS backends).

## Toolsets

Set \`SUDAR_TOOLSET\` to \`integrator\`, \`creator\`, \`admin\`, \`learner\`, or \`all\` (default).

### Integrator (LMS / ALP)

- \`sudar_ingest_learning_events\` — ingest learning telemetry into the Digital Learner Twin
- \`sudar_tutor_query\` — ask the Sudar tutor for a learner (ALP)
- \`sudar_next_best_action\` — compute next-best-action for a learner
- \`sudar_resolve_lms_user\` — map external LMS user ID to Sudar profile
- \`sudar_create_embed_token\` — create embed token for tutor widget in external LMS

### Creator (course authoring)

- \`sudar_generate_outline\` — generate course module outline
- \`sudar_generate_course_metadata\` — generate description, tags, outcomes
- \`sudar_generate_course\` — generate full draft course from topic
- \`sudar_generate_quiz\` — generate quiz questions for a module
- \`sudar_generate_from_document\` — generate course from document text or URL
- \`sudar_create_course\` — create draft course shell in Studio
- \`sudar_list_courses\` — list courses in your organisation

### Admin (L&D management)

- \`sudar_run_admin_agent\` — run admin agent (cohort health, path analytics)
- \`sudar_list_agent_skills\` — list Sudar Agents skills

### Learner (learner-facing assistants)

- \`sudar_run_learner_agent\` — run learner agent (week plan, etc.)
- \`sudar_learner_tutor_query\` — ask Sudar tutor as signed-in learner
- \`sudar_learner_next_action\` — refresh next-best-action
- \`sudar_learner_proactive_nudge\` — generate proactive tutor nudge

## Example prompts (ChatGPT / Claude)

- "Generate a 5-module outline for cybersecurity awareness training using Sudar MCP."
- "List my draft courses in Sudar Studio."
- "What should this learner do next? Use sudar_learner_next_action."

## Local stdio MCP

\`\`\`bash
npx @sudar/mcp-server
\`\`\`

## About Sudar

Sudar is forever free and open source. Built by Dhanikesh "Dhani" Karunanithi to make AI-powered education accessible to all.

- **GitHub:** https://github.com/Dhanikesh-Karunanithi/Sudar
- **Docs:** https://github.com/Dhanikesh-Karunanithi/Sudar/blob/main/docs/MCP_SERVERS.md
- **ByteVerse ecosystem:** https://byteverse.app
`;
}

export function buildMcpDiscoveryJson(base: string, studioUrl: string, learnUrl: string) {
  return {
    service: "sudar-mcp-cloudflare",
    name: "Sudar MCP Server",
    description:
      "Model Context Protocol server for Sudar — forever-free, open AI-powered Learning Operating System. Connect ChatGPT, Claude, Cursor, and other AI agents.",
    version: "0.2.0",
    platform: {
      name: "Sudar",
      mission: "Learns with you, for you.",
      foreverFree: true,
      github: "https://github.com/Dhanikesh-Karunanithi/Sudar",
      llmsTxt: "https://teachwithsudar.com/llms.txt",
      studio: studioUrl || "https://studio.thesudar.com",
      learn: learnUrl || "https://learn.thesudar.com",
      byteverse: "https://byteverse.app",
      creator: {
        name: "Dhanikesh Karunanithi",
        nickname: "Dhani",
        contact: "connect@dhanikeshkarunanithi.com",
      },
    },
    endpoints: {
      mcp: `${base}/mcp`,
      oauthDiscovery: `${base}/.well-known/oauth-authorization-server`,
      oauthAuthorize: `${base}/oauth/authorize`,
      oauthToken: `${base}/oauth/token`,
      health: `${base}/health`,
      llmsTxt: `${base}/llms.txt`,
    },
    authentication: {
      oauth: "Supabase JWT via Studio login — see /.well-known/oauth-authorization-server",
      bearer: "Authorization: Bearer <supabase_access_token>",
      alpApiKey: "x-alp-api-key header for integrator toolset",
    },
    toolsets: ["integrator", "creator", "admin", "learner", "all"],
    tools: {
      integrator: [
        "sudar_ingest_learning_events",
        "sudar_tutor_query",
        "sudar_next_best_action",
        "sudar_resolve_lms_user",
        "sudar_create_embed_token",
      ],
      creator: [
        "sudar_generate_outline",
        "sudar_generate_course_metadata",
        "sudar_generate_course",
        "sudar_generate_quiz",
        "sudar_generate_from_document",
        "sudar_create_course",
        "sudar_list_courses",
      ],
      admin: ["sudar_run_admin_agent", "sudar_list_agent_skills"],
      learner: [
        "sudar_run_learner_agent",
        "sudar_learner_tutor_query",
        "sudar_learner_next_action",
        "sudar_learner_proactive_nudge",
      ],
    },
    localStdio: {
      package: "@sudar/mcp-server",
      command: "npx @sudar/mcp-server",
    },
    documentation: "https://github.com/Dhanikesh-Karunanithi/Sudar/blob/main/docs/MCP_SERVERS.md",
  };
}

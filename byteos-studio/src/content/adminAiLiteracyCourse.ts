/**
 * In-app "Understanding AI in Sudar" course copy. Mirror structure in docs/admin/AI_LITERACY_AND_LOCAL_MODELS.md.
 */
export type AdminAiLiteracyLesson = {
  id: string
  title: string
  summary: string
  sections: { heading?: string; paragraphs: string[] }[]
}

export const ADMIN_AI_LITERACY_LESSONS: AdminAiLiteracyLesson[] = [
  {
    id: 'what-sudar-uses-ai-for',
    title: 'What Sudar uses AI for',
    summary: 'A quick map of where AI shows up in Studio and Learn.',
    sections: [
      {
        paragraphs: [
          'Sudar uses AI to help your team create courses faster and to give each learner a helpful tutor named Sudar.',
          'In Sudar Studio, AI can suggest outlines, write or expand module text, build quizzes, and draft scripts for audio or video-style content.',
          'In Sudar Learn, the Sudar tutor answers questions about the course, explains tricky ideas, and can run small workflows on text you paste (like a short summary).',
          'None of this replaces your judgement: you still choose what to publish, and learners still choose how they study.',
        ],
      },
    ],
  },
  {
    id: 'cloud-vs-your-server',
    title: 'Cloud vs your own server',
    summary: 'Where the AI runs and who can see prompts.',
    sections: [
      {
        heading: 'Cloud (default)',
        paragraphs: [
          'Most teams connect Sudar to a cloud AI service using an API key (see AI & API Keys). The Sudar server sends the minimum text needed for each task to that provider.',
          'Your organisation controls which provider and keys are used; Sudar does not show raw keys in the admin UI.',
        ],
      },
      {
        heading: 'Private server (optional)',
        paragraphs: [
          'If your policy requires models to stay on your network, you can run an open model (for example Google Gemma via Ollama) on a machine you control.',
          'When enabled in Org settings, Sudar sends chat and generation requests to that address instead of the default cloud path.',
          'Embeddings for course search may still use a separate cloud or local setup—your operator documents that per deployment.',
        ],
      },
    ],
  },
  {
    id: 'gemma-and-local-models',
    title: 'Gemma and local models (plain language)',
    summary: 'What “open model” means and where to learn more.',
    sections: [
      {
        paragraphs: [
          'Gemma is a family of language models released by Google for developers and organisations to run under clear terms of use. They are not “anonymous internet AI”—you download weights and run them yourself or through a trusted app.',
          'Smaller Gemma sizes are designed to run on common laptops or desktops when paired with tools like Ollama or LM Studio.',
        ],
      },
      {
        heading: 'Official references',
        paragraphs: [
          'Google’s overview of how to run Gemma: https://ai.google.dev/gemma/docs/run',
          'Terms of use always apply—read them before production use.',
        ],
      },
    ],
  },
  {
    id: 'connecting-a-private-server',
    title: 'Connecting a private server',
    summary: 'Mental model: install an app, pull a model, paste an address.',
    sections: [
      {
        paragraphs: [
          'Think of a private AI server like a small web service inside your office or VPN. Sudar talks to it over HTTP, the same way it talks to cloud APIs.',
          'Typical steps: install Ollama or LM Studio on a machine, download a model (for example gemma3:4b), note the address and port (often 11434 for Ollama).',
          'In Org settings → “Where Sudar runs your AI”, turn on private server, paste the full address (starting with http:// or https://), and enter the model name exactly as your app shows it.',
          'The “password” for the server is set once on the Sudar server by IT (environment variable), not in the form—this keeps secrets out of the database.',
        ],
      },
    ],
  },
  {
    id: 'org-settings-walkthrough',
    title: 'Org settings walkthrough',
    summary: 'Where to click in Sudar Studio.',
    sections: [
      {
        paragraphs: [
          'Open Org settings from the sidebar. The section “Where Sudar runs your AI” controls private server routing for your organisation.',
          'AI & API Keys is still where you manage cloud provider keys and see signup links.',
          'After changing private server settings, use “Test connection” to confirm Sudar can reach your AI app.',
        ],
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    summary: 'When Sudar says it cannot reach the AI.',
    sections: [
      {
        paragraphs: [
          'Check that the AI app is running on the machine and that the port matches what you typed.',
          'If Sudar runs in the cloud but your model runs on a laptop, they cannot talk—private AI usually needs Sudar deployed where it can reach your network, or a tunnel/VPN your operator approves.',
          'Wrong model name is a common mistake: copy the name from ollama list or LM Studio exactly.',
          'Firewalls must allow the Sudar server to open an outbound connection to your private address. Your IT team can confirm.',
        ],
      },
    ],
  },
  {
    id: 'governance-and-privacy',
    title: 'Governance and privacy',
    summary: 'Policies, retention, and trust docs.',
    sections: [
      {
        paragraphs: [
          'Use Governance in Studio to see high-level protections for your organisation (tutor safety, personalization, retention fields).',
          'The technical trust pack in the Sudar repository describes data flows, subprocessors, and threat considerations—share it with security reviewers.',
          'Private AI reduces data leaving your network for model inference, but you still need a full privacy assessment for your jurisdiction and use case.',
        ],
      },
    ],
  },
]

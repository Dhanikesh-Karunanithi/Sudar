/**
 * Single source of truth for AI/API provider keys: used by AI & API Keys page
 * and for "How to get this key" steps. Keep in sync with docs/ENV_REFERENCE.md.
 */

export type ProviderKeyDef = {
  id: string
  name: string
  envVar: string
  category: 'chat' | 'embed' | 'tts' | 'media' | 'required' | 'integrations' | 'optional'
  signupUrl: string
  steps: string[]
  description?: string
}

export const PROVIDER_KEYS: ProviderKeyDef[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    envVar: 'OPENROUTER_API_KEY',
    category: 'chat',
    signupUrl: 'https://openrouter.ai/keys',
    steps: [
      'Go to openrouter.ai and sign up or log in.',
      'Open the API Keys page (link above) and create an API key.',
      'Add OPENROUTER_API_KEY=your_key to your .env.local or host environment variables.',
      'Restart your dev server or redeploy.',
    ],
    description: 'Single key for many models (OpenAI, Anthropic, etc.).',
  },
  {
    id: 'together',
    name: 'Together AI',
    envVar: 'TOGETHER_API_KEY',
    category: 'chat',
    signupUrl: 'https://api.together.xyz/settings/api-keys',
    steps: [
      'Go to api.together.xyz and sign up or log in.',
      'Open Settings → API Keys and create a key.',
      'Add TOGETHER_API_KEY=your_key to .env.local or host env.',
      'Restart or redeploy.',
    ],
    description: 'Cost-effective open models. Used for chat and embeddings when EMBED_PROVIDER=together.',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    envVar: 'OPENAI_API_KEY',
    category: 'chat',
    signupUrl: 'https://platform.openai.com/api-keys',
    steps: [
      'Go to platform.openai.com and sign up or log in.',
      'Open API Keys and create a new key.',
      'Add OPENAI_API_KEY=your_key to .env.local or host env.',
      'Restart or redeploy.',
    ],
    description: 'GPT-4 and other models. Also used for TTS and embeddings when configured.',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    envVar: 'ANTHROPIC_API_KEY',
    category: 'chat',
    signupUrl: 'https://console.anthropic.com/settings/keys',
    steps: [
      'Go to console.anthropic.com and sign up or log in.',
      'Open Settings → API Keys and create a key.',
      'Add ANTHROPIC_API_KEY=your_key to .env.local or host env.',
      'Restart or redeploy.',
    ],
    description: 'Claude models.',
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    envVar: 'HUGGINGFACE_API_KEY',
    category: 'embed',
    signupUrl: 'https://huggingface.co/settings/tokens',
    steps: [
      'Go to huggingface.co and sign up or log in.',
      'Open Settings → Access Tokens and create a token (read or write).',
      'Add HUGGINGFACE_API_KEY=your_token to .env.local or host env (Learn app).',
      'Set EMBED_PROVIDER=huggingface in Learn if you want to use HF for embeddings.',
    ],
    description: 'Used for embeddings when EMBED_PROVIDER=huggingface (e.g. BAAI/bge-large-en-v1.5).',
  },
  {
    id: 'google_search',
    name: 'Google Custom Search',
    envVar: 'GOOGLE_SEARCH_API_KEY',
    category: 'media',
    signupUrl: 'https://console.cloud.google.com/apis/credentials',
    steps: [
      'Create a project in Google Cloud Console and enable Custom Search API.',
      'Create an API key under Credentials.',
      'Create a Custom Search Engine at programmablesearchengine.google.com and note the Search Engine ID.',
      'Add GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID to your env.',
    ],
    description: 'Optional. For image and web search in the course editor.',
  },
  {
    id: 'pexels',
    name: 'Pexels',
    envVar: 'PEXELS_API_KEY',
    category: 'media',
    signupUrl: 'https://www.pexels.com/api/',
    steps: ['Sign up at pexels.com/api and get your API key.', 'Add PEXELS_API_KEY=your_key to env.'],
  },
  {
    id: 'unsplash',
    name: 'Unsplash',
    envVar: 'UNSPLASH_ACCESS_KEY',
    category: 'media',
    signupUrl: 'https://unsplash.com/developers',
    steps: ['Register an app at unsplash.com/developers.', 'Add UNSPLASH_ACCESS_KEY=your_key to env.'],
  },
  {
    id: 'giphy',
    name: 'Giphy',
    envVar: 'GIPHY_API_KEY',
    category: 'media',
    signupUrl: 'https://developers.giphy.com/dashboard/',
    steps: ['Create an app at developers.giphy.com.', 'Add GIPHY_API_KEY=your_key to env.'],
  },
  {
    id: 'supabase_url',
    name: 'Supabase URL',
    envVar: 'NEXT_PUBLIC_SUPABASE_URL',
    category: 'required',
    signupUrl: 'https://supabase.com/dashboard/project/_/settings/api',
    steps: ['Create a project at supabase.com. In Project Settings → API, copy the Project URL.', 'Add NEXT_PUBLIC_SUPABASE_URL=your_url to env.'],
  },
  {
    id: 'supabase_anon',
    name: 'Supabase anon key',
    envVar: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    category: 'required',
    signupUrl: 'https://supabase.com/dashboard/project/_/settings/api',
    steps: ['In the same Supabase API settings, copy the anon public key.', 'Add NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key to env.'],
  },
  {
    id: 'supabase_service_role',
    name: 'Supabase service role key',
    envVar: 'SUPABASE_SERVICE_ROLE_KEY',
    category: 'required',
    signupUrl: 'https://supabase.com/dashboard/project/_/settings/api',
    steps: ['In Supabase API settings, copy the service_role key (keep it secret).', 'Add SUPABASE_SERVICE_ROLE_KEY=your_key to env.'],
  },
  {
    id: 'intelligence_url',
    name: 'Sudar Intelligence URL',
    envVar: 'BYTEOS_INTELLIGENCE_URL',
    category: 'required',
    signupUrl: '',
    steps: ['Set BYTEOS_INTELLIGENCE_URL to your Intelligence service base URL (e.g. http://localhost:8000).'],
  },
]

const PLACEHOLDERS = ['your_', 'your-', 'generate_', 'example', 'xxx', 'sk-xxx']

export function isKeyConfigured(value: string | undefined): boolean {
  if (!value || typeof value !== 'string') return false
  const t = value.trim()
  if (t.length < 8) return false
  return !PLACEHOLDERS.some((p) => t.toLowerCase().includes(p))
}

/**
 * Embedding API for RAG. Multi-provider: Together AI, OpenAI, Hugging Face.
 * Set EMBED_PROVIDER=together | openai | huggingface (default: first available).
 * OpenRouter can be added when using an OpenAI-compatible embeddings endpoint; document in ENV_REFERENCE.
 * If no key for the selected provider, embedText returns [] and RAG is skipped.
 */
const TOGETHER_EMBED_URL = 'https://api.together.xyz/v1/embeddings'
const OPENAI_EMBED_URL = 'https://api.openai.com/v1/embeddings'
const HUGGINGFACE_EMBED_BASE = 'https://api-inference.huggingface.co/pipeline/feature-extraction'

export type EmbedProvider = 'together' | 'openai' | 'huggingface'

const TOGETHER_EMBED_MODEL = 'BAAI/bge-large-en-v1.5'
const TOGETHER_EMBED_DIM = 1024
const OPENAI_EMBED_MODEL = 'text-embedding-3-small'
const OPENAI_EMBED_DIM = 1024
/** HF model that yields 1024-dim vectors for pgvector compatibility */
const HUGGINGFACE_EMBED_MODEL = 'BAAI/bge-large-en-v1.5'

export const EMBED_DIMENSIONS = 1024

function getEmbedProvider(): EmbedProvider {
  const env = process.env.EMBED_PROVIDER?.trim().toLowerCase()
  if (env === 'openai' || env === 'together' || env === 'huggingface') return env
  if (process.env.TOGETHER_API_KEY?.trim()) return 'together'
  if (process.env.OPENAI_API_KEY?.trim()) return 'openai'
  if (process.env.HUGGINGFACE_API_KEY?.trim()) return 'huggingface'
  return 'together'
}

async function embedWithTogether(text: string): Promise<number[]> {
  const apiKey = process.env.TOGETHER_API_KEY?.trim()
  if (!apiKey) return []
  const truncated = text.trim().slice(0, 8000)
  const res = await fetch(TOGETHER_EMBED_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.EMBED_MODEL?.trim() || TOGETHER_EMBED_MODEL,
      input: truncated,
    }),
  })
  if (!res.ok) return []
  const data = await res.json()
  const vec = data.data?.[0]?.embedding
  return Array.isArray(vec) ? vec : []
}

async function embedWithOpenAI(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return []
  const truncated = text.trim().slice(0, 8000)
  const res = await fetch(OPENAI_EMBED_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_EMBED_MODEL,
      input: truncated,
      dimensions: OPENAI_EMBED_DIM,
    }),
  })
  if (!res.ok) return []
  const data = await res.json()
  const vec = data.data?.[0]?.embedding
  return Array.isArray(vec) ? vec : []
}

async function embedWithHuggingFace(text: string): Promise<number[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY?.trim()
  if (!apiKey) return []
  const model = process.env.EMBED_MODEL?.trim() || HUGGINGFACE_EMBED_MODEL
  const truncated = text.trim().slice(0, 8000)
  const res = await fetch(`${HUGGINGFACE_EMBED_BASE}/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: truncated }),
  })
  if (!res.ok) return []
  const data = (await res.json()) as number[] | number[][]
  if (Array.isArray(data) && data.length > 0) {
    const vec = Array.isArray(data[0]) ? data[0] : data
    return vec.length === EMBED_DIMENSIONS ? vec : []
  }
  return []
}

export async function embedText(text: string): Promise<number[]> {
  if (!text?.trim()) return []
  const provider = getEmbedProvider()
  if (provider === 'openai') return embedWithOpenAI(text)
  if (provider === 'huggingface') return embedWithHuggingFace(text)
  return embedWithTogether(text)
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  const inputs = texts.map((t) => (t?.trim() ?? '').slice(0, 8000)).filter(Boolean)
  if (inputs.length === 0) return texts.map(() => [])

  const provider = getEmbedProvider()
  if (provider === 'huggingface') {
    const apiKey = process.env.HUGGINGFACE_API_KEY?.trim()
    if (!apiKey) return texts.map(() => [])
    const model = process.env.EMBED_MODEL?.trim() || HUGGINGFACE_EMBED_MODEL
    const res = await fetch(`${HUGGINGFACE_EMBED_BASE}/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: inputs }),
    })
    if (!res.ok) return texts.map(() => [])
    const data = (await res.json()) as number[][] | number[]
    const list = Array.isArray(data) ? data : []
    const out: number[][] = []
    for (let i = 0; i < texts.length; i++) {
      const vec = list[i]
      out.push(Array.isArray(vec) && vec.length === EMBED_DIMENSIONS ? vec : [])
    }
    return out
  }
  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY?.trim()
    if (!apiKey) return texts.map(() => [])
    const res = await fetch(OPENAI_EMBED_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_EMBED_MODEL,
        input: inputs,
        dimensions: OPENAI_EMBED_DIM,
      }),
    })
    if (!res.ok) return texts.map(() => [])
    const data = await res.json()
    const list = (data.data ?? []) as Array<{ index?: number; embedding?: number[] }>
    const byIndex = [...list].sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    return byIndex.map((x) => (Array.isArray(x.embedding) ? x.embedding : []))
  }

  const apiKey = process.env.TOGETHER_API_KEY?.trim()
  if (!apiKey) return texts.map(() => [])
  const res = await fetch(TOGETHER_EMBED_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.EMBED_MODEL?.trim() || TOGETHER_EMBED_MODEL,
      input: inputs,
    }),
  })
  if (!res.ok) return texts.map(() => [])
  const data = await res.json()
  const list = (data.data ?? []) as Array<{ index?: number; embedding?: number[] }>
  const byIndex = [...list].sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
  return byIndex.map((x) => (Array.isArray(x.embedding) ? x.embedding : []))
}

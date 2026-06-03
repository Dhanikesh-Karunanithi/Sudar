/**
 * Embedding API for RAG. Multi-provider: Together AI, OpenAI, Hugging Face.
 * Set EMBED_PROVIDER=together | openai | huggingface (default: first available).
 * HF defaults to BAAI/bge-m3 (multilingual, 1024 dims). See HF_EMBED_MODEL / EMBED_MODEL.
 * If no key for the selected provider, embedText returns [] and RAG is skipped.
 */
import { hfEmbedTexts, HF_DEFAULT_EMBED_MODEL } from '@/lib/hf/client'

const TOGETHER_EMBED_URL = 'https://api.together.xyz/v1/embeddings'
const OPENAI_EMBED_URL = 'https://api.openai.com/v1/embeddings'

export type EmbedProvider = 'together' | 'openai' | 'huggingface'

const TOGETHER_EMBED_MODEL = 'BAAI/bge-large-en-v1.5'
const OPENAI_EMBED_MODEL = 'text-embedding-3-small'
const OPENAI_EMBED_DIM = 1024

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
  const [vec] = await hfEmbedTexts([text], EMBED_DIMENSIONS)
  return vec ?? []
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
    if (!process.env.HUGGINGFACE_API_KEY?.trim()) return texts.map(() => [])
    return hfEmbedTexts(inputs, EMBED_DIMENSIONS)
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

/** Default HF embedding model id (for docs / operator reference). */
export { HF_DEFAULT_EMBED_MODEL }

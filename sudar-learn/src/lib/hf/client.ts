/**
 * Hugging Face Inference client for Sudar Learn.
 * Supports HF Router (default), legacy feature-extraction pipeline, and OpenAI-compatible
 * TEI/vLLM endpoints via HF_INFERENCE_BASE_URL.
 */

export const HF_DEFAULT_EMBED_MODEL = 'BAAI/bge-m3'
export const HF_DEFAULT_RERANK_MODEL = 'BAAI/bge-reranker-v2-m3'
export const HF_DEFAULT_CHAT_MODEL = 'meta-llama/Meta-Llama-3.1-8B-Instruct'
export const HF_DEFAULT_IMAGE_MODEL = 'black-forest-labs/FLUX.1-schnell'

const HF_ROUTER_BASE = 'https://router.huggingface.co/hf-inference/models'
const HF_LEGACY_FEATURE_BASE = 'https://api-inference.huggingface.co/pipeline/feature-extraction'

export function getHfApiKey(): string {
  return process.env.HUGGINGFACE_API_KEY?.trim() ?? ''
}

export function getHfInferenceBaseUrl(): string | null {
  const raw = process.env.HF_INFERENCE_BASE_URL?.trim()
  return raw ? raw.replace(/\/$/, '') : null
}

export function getHfEmbedModel(): string {
  return (
    process.env.HF_EMBED_MODEL?.trim() ||
    process.env.EMBED_MODEL?.trim() ||
    HF_DEFAULT_EMBED_MODEL
  )
}

export function getHfRerankModel(): string {
  return process.env.HF_RERANK_MODEL?.trim() || HF_DEFAULT_RERANK_MODEL
}

export function isRagRerankEnabled(): boolean {
  return process.env.RAG_RERANK_ENABLED?.trim().toLowerCase() === 'true'
}

function hfAuthHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
}

/** Mean-pool token-level embeddings to a single vector. */
export function meanPoolEmbedding(matrix: number[][]): number[] {
  if (!matrix.length) return []
  const dim = matrix[0]?.length ?? 0
  if (dim === 0) return []
  const out = new Array(dim).fill(0)
  let count = 0
  for (const row of matrix) {
    if (!Array.isArray(row) || row.length !== dim) continue
    for (let i = 0; i < dim; i++) out[i] += row[i]
    count++
  }
  if (count === 0) return []
  return out.map((v) => v / count)
}

function normalizeEmbeddingPayload(data: unknown): number[] {
  if (!Array.isArray(data)) return []
  if (data.length === 0) return []
  if (typeof data[0] === 'number') return data as number[]
  if (Array.isArray(data[0])) return meanPoolEmbedding(data as number[][])
  return []
}

function openAiCompatibleBase(): string | null {
  const base = getHfInferenceBaseUrl()
  if (!base) return null
  return base.includes('/v1') ? base.replace(/\/v1\/?$/, '') : base
}

async function embedViaOpenAiCompatible(
  apiKey: string,
  texts: string[],
  model: string,
  expectedDim: number
): Promise<number[][]> {
  const root = openAiCompatibleBase()
  if (!root) return texts.map(() => [])
  const url = `${root}/v1/embeddings`
  const res = await fetch(url, {
    method: 'POST',
    headers: hfAuthHeaders(apiKey),
    body: JSON.stringify({ model, input: texts }),
  })
  if (!res.ok) return texts.map(() => [])
  const data = (await res.json()) as { data?: Array<{ embedding?: number[] }> }
  const list = [...(data.data ?? [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
  return texts.map((_, i) => {
    const vec = list[i]?.embedding
    return Array.isArray(vec) && vec.length === expectedDim ? vec : []
  })
}

async function embedViaHfRouter(
  apiKey: string,
  texts: string[],
  model: string,
  expectedDim: number
): Promise<number[][]> {
  const url = `${HF_ROUTER_BASE}/${model}`
  const out: number[][] = []
  for (const text of texts) {
    const res = await fetch(url, {
      method: 'POST',
      headers: hfAuthHeaders(apiKey),
      body: JSON.stringify({ inputs: text }),
    })
    if (!res.ok) {
      out.push([])
      continue
    }
    const data = await res.json()
    const vec = normalizeEmbeddingPayload(data)
    out.push(vec.length === expectedDim ? vec : [])
  }
  return out
}

async function embedViaLegacyPipeline(
  apiKey: string,
  texts: string[],
  model: string,
  expectedDim: number
): Promise<number[][]> {
  const url = `${HF_LEGACY_FEATURE_BASE}/${model}`
  const res = await fetch(url, {
    method: 'POST',
    headers: hfAuthHeaders(apiKey),
    body: JSON.stringify({ inputs: texts.length === 1 ? texts[0] : texts }),
  })
  if (!res.ok) return texts.map(() => [])
  const data = await res.json()
  if (texts.length === 1) {
    const vec = normalizeEmbeddingPayload(data)
    return [vec.length === expectedDim ? vec : []]
  }
  const list = Array.isArray(data) ? data : []
  return texts.map((_, i) => {
    const vec = normalizeEmbeddingPayload(list[i])
    return vec.length === expectedDim ? vec : []
  })
}

/**
 * Embed one or more texts via Hugging Face (Router, legacy pipeline, or TEI OpenAI API).
 */
export async function hfEmbedTexts(
  texts: string[],
  expectedDim: number
): Promise<number[][]> {
  const apiKey = getHfApiKey()
  if (!apiKey || texts.length === 0) return texts.map(() => [])

  const model = getHfEmbedModel()
  const inputs = texts.map((t) => (t?.trim() ?? '').slice(0, 8000)).filter(Boolean)
  if (inputs.length === 0) return texts.map(() => [])

  if (getHfInferenceBaseUrl()) {
    const viaOai = await embedViaOpenAiCompatible(apiKey, inputs, model, expectedDim)
    if (viaOai.some((v) => v.length === expectedDim)) return viaOai
  }

  const viaRouter = await embedViaHfRouter(apiKey, inputs, model, expectedDim)
  if (viaRouter.some((v) => v.length === expectedDim)) return viaRouter

  return embedViaLegacyPipeline(apiKey, inputs, model, expectedDim)
}

/**
 * Rerank passages for a query using a cross-encoder on HF Inference.
 * Returns indices sorted by score descending.
 */
export async function hfRerank(
  query: string,
  passages: string[]
): Promise<number[]> {
  const apiKey = getHfApiKey()
  if (!apiKey || !query.trim() || passages.length === 0) {
    return passages.map((_, i) => i)
  }

  const model = getHfRerankModel()
  const base = getHfInferenceBaseUrl()
  const url = base
    ? `${base.replace(/\/$/, '')}/models/${model}`
    : `https://api-inference.huggingface.co/models/${model}`

  const res = await fetch(url, {
    method: 'POST',
    headers: hfAuthHeaders(apiKey),
    body: JSON.stringify({
      inputs: {
        source_sentence: query.trim().slice(0, 2000),
        sentences: passages.map((p) => p.slice(0, 2000)),
      },
    }),
  })
  if (!res.ok) return passages.map((_, i) => i)

  const data = await res.json()
  if (!Array.isArray(data)) return passages.map((_, i) => i)

  const scored = data.map((score, i) => ({ i, score: typeof score === 'number' ? score : 0 }))
  scored.sort((a, b) => b.score - a.score)
  return scored.map((s) => s.i)
}

import type { SudarArtVisualStyle } from '@shared-sudarart/aipencilCompiler'

export type FluxGenerateInput = {
  prompt: string
  style: SudarArtVisualStyle
}

export type FluxGenerateOutput = {
  imageUrl: string
  model: string
}

function stylePrefix(style: SudarArtVisualStyle): string {
  switch (style) {
    case 'cartoon':
      return 'clean vector cartoon illustration'
    case 'watercolor':
      return 'watercolor digital painting'
    case 'pixel-art':
      return 'pixel art scene'
    case 'line-art':
      return 'minimal line art illustration'
    case 'photorealistic':
      return 'photorealistic cinematic artwork'
    case 'geometric':
      return 'geometric modern illustration'
    default:
      return 'high-quality digital illustration'
  }
}

/**
 * Calls Hugging Face Inference for Flux/SD models and returns a data URL.
 */
export async function generateFluxImage(input: FluxGenerateInput): Promise<FluxGenerateOutput> {
  const token = process.env.FLUX_API_KEY || process.env.HUGGINGFACE_API_KEY
  const model = process.env.FLUX_MODEL || 'black-forest-labs/FLUX.1-dev'
  if (!token) {
    throw new Error('FLUX_API_KEY or HUGGINGFACE_API_KEY is required for flux mode')
  }

  const text = `${stylePrefix(input.style)}, ${input.prompt}, high detail, professional composition`
  const endpoint = `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: text,
      parameters: {
        guidance_scale: 3.5,
        num_inference_steps: 28,
      },
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Flux request failed: ${response.status} ${message}`)
  }

  const contentType = response.headers.get('content-type') || 'image/png'
  const bytes = Buffer.from(await response.arrayBuffer())
  const dataUrl = `data:${contentType};base64,${bytes.toString('base64')}`

  return {
    imageUrl: dataUrl,
    model,
  }
}


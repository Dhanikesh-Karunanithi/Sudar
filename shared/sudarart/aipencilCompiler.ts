import crypto from 'crypto'

export type SudarArtVisualStyle =
  | 'auto'
  | 'geometric'
  | 'cartoon'
  | 'watercolor'
  | 'pixel-art'
  | 'photorealistic'
  | 'line-art'

export type AipencilScene = {
  width: number
  height: number
  background: string
  elements: Array<Record<string, unknown>>
}

export type AipencilRenderResult = {
  svg: string
  scene: AipencilScene
  usedFallback: boolean
  engine: 'aipencil-cli' | 'fallback-svg'
}

function hashToInt(seed: string): number {
  const hex = crypto.createHash('sha256').update(seed).digest('hex').slice(0, 8)
  return parseInt(hex, 16)
}

function paletteFromPrompt(prompt: string): { bg: string; primary: string; secondary: string; accent: string } {
  const value = hashToInt(prompt)
  const hue = value % 360
  const hue2 = (hue + 38) % 360
  const hue3 = (hue + 196) % 360
  return {
    bg: `hsl(${hue}, 74%, 14%)`,
    primary: `hsl(${hue2}, 80%, 56%)`,
    secondary: `hsl(${hue3}, 78%, 62%)`,
    accent: `hsl(${(hue + 300) % 360}, 82%, 64%)`,
  }
}

function inferSceneMood(prompt: string): 'night' | 'sunset' | 'day' {
  const p = prompt.toLowerCase()
  if (p.includes('night') || p.includes('moon') || p.includes('star')) return 'night'
  if (p.includes('sunset') || p.includes('evening')) return 'sunset'
  return 'day'
}

export function buildAipencilScene(prompt: string, style: SudarArtVisualStyle): AipencilScene {
  const palette = paletteFromPrompt(`${prompt}:${style}`)
  const mood = inferSceneMood(prompt)
  const width = 1024
  const height = 768
  const elements: Array<Record<string, unknown>> = []

  const sky = mood === 'night' ? '#111827' : mood === 'sunset' ? '#7c2d12' : '#1e3a8a'
  elements.push({
    type: 'rect',
    x: 0,
    y: 0,
    width,
    height,
    fill: sky,
  })

  if (mood !== 'day') {
    elements.push({ type: 'circle', cx: 820, cy: 120, r: 70, fill: '#f8fafc', opacity: 0.9 })
  }

  elements.push({
    type: 'circle',
    cx: 500,
    cy: 670,
    r: 430,
    fill: '#0b0f19',
  })

  elements.push({
    type: 'circle',
    cx: 500,
    cy: 360,
    r: 92,
    fill: palette.primary,
  })
  elements.push({
    type: 'rect',
    x: 455,
    y: 440,
    width: 92,
    height: 140,
    rx: style === 'pixel-art' ? 2 : 20,
    fill: palette.secondary,
  })
  elements.push({
    type: 'rect',
    x: 420,
    y: 455,
    width: 26,
    height: 110,
    rx: style === 'pixel-art' ? 2 : 16,
    fill: palette.accent,
    rotate: -18,
    cx: 433,
    cy: 510,
  })
  elements.push({
    type: 'rect',
    x: 555,
    y: 455,
    width: 26,
    height: 110,
    rx: style === 'pixel-art' ? 2 : 16,
    fill: palette.accent,
    rotate: 18,
    cx: 568,
    cy: 510,
  })

  return { width, height, background: palette.bg, elements }
}

function elementToSvg(el: Record<string, unknown>): string {
  const type = typeof el.type === 'string' ? el.type : ''
  const attrs: string[] = []
  for (const [key, value] of Object.entries(el)) {
    if (key === 'type' || value === undefined || value === null) continue
    const attrKey = key === 'cx' || key === 'cy' || key === 'rx' || key === 'ry' ? key : key
    attrs.push(`${attrKey}="${String(value).replace(/"/g, '&quot;')}"`)
  }
  if (!type) return ''
  return `<${type} ${attrs.join(' ')} />`
}

export function compileAipencilFallbackSvg(scene: AipencilScene): string {
  const body = scene.elements.map(elementToSvg).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}" role="img" aria-label="SudarArt illustration">
  <rect width="${scene.width}" height="${scene.height}" fill="${scene.background}" />
  ${body}
</svg>`
}


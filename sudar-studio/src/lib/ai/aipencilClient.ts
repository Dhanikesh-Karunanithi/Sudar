import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import os from 'os'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import {
  buildAipencilScene,
  compileAipencilFallbackSvg,
  type SudarArtVisualStyle,
} from '@shared-sudarart/aipencilCompiler'

const execFileAsync = promisify(execFile)

export type AipencilRenderInput = {
  prompt: string
  style: SudarArtVisualStyle
}

export type AipencilRenderOutput = {
  svg: string
  engine: 'aipencil-cli' | 'fallback-svg'
  usedFallback: boolean
  warning?: string
}

/**
 * Attempts CLI render first (`aipencil -o output.svg scene.json`), then falls back to deterministic SVG.
 */
export async function renderWithAipencil(input: AipencilRenderInput): Promise<AipencilRenderOutput> {
  const scene = buildAipencilScene(input.prompt, input.style)
  const aipencilPath = process.env.AIPENCIL_PATH?.trim() || 'aipencil'

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'sudarart-aipencil-'))
  const sceneFile = path.join(tempDir, 'scene.json')
  const outFile = path.join(tempDir, 'art.svg')

  try {
    await writeFile(sceneFile, JSON.stringify(scene, null, 2), 'utf8')
    await execFileAsync(aipencilPath, ['-o', outFile, sceneFile], {
      timeout: 15_000,
      windowsHide: true,
      maxBuffer: 2 * 1024 * 1024,
    })

    const svg = await readFile(outFile, 'utf8')
    if (!svg.includes('<svg')) {
      throw new Error('aipencil did not return an SVG payload')
    }

    return {
      svg,
      engine: 'aipencil-cli',
      usedFallback: false,
    }
  } catch (error) {
    const fallbackSvg = compileAipencilFallbackSvg(scene)
    return {
      svg: fallbackSvg,
      engine: 'fallback-svg',
      usedFallback: true,
      warning: error instanceof Error ? error.message : 'aipencil render failed',
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}


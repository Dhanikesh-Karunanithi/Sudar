import { NextResponse } from 'next/server'
import { getSudarVidDefaultEngineMode } from '@/lib/sudarvid'
import { getDefaultVideoPresetFromEnv, type SudarVidVideoPreset } from '@/lib/sudarvidPresets'

export const dynamic = 'force-dynamic'

/**
 * Public defaults for Watch (SudarVid) generation UI.
 * No auth required — only exposes non-secret env-driven defaults.
 */
export async function GET() {
  const defaultEngineMode = getSudarVidDefaultEngineMode()
  const defaultPreset: SudarVidVideoPreset = getDefaultVideoPresetFromEnv()

  return NextResponse.json({
    default_engine_mode: defaultEngineMode,
    default_video_preset: defaultPreset,
    presets: [
      {
        id: 'standard' as const,
        label: 'Standard',
        description: 'Animated slides with narration — fast to generate.',
      },
      {
        id: 'rich' as const,
        label: 'Rich lesson',
        description: 'Mini-course flow with checkpoints and interactions where appropriate.',
      },
      {
        id: 'standard_mp4' as const,
        label: 'Standard + MP4',
        description: 'Standard deck plus an encoded MP4 file (slower; needs ffmpeg on SudarVid).',
      },
      {
        id: 'rich_mp4' as const,
        label: 'Rich lesson + MP4',
        description: 'Rich lesson plus MP4 export (slowest).',
      },
    ],
  })
}

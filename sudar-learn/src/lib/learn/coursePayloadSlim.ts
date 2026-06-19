/**
 * Strip embedded media from course settings before SSR/RSC serialization.
 * audioDataURL fields can be multi-MB base64 blobs and exceed Cloudflare Worker memory limits.
 */
export function slimCourseSettingsForSsr(settings: unknown): Record<string, unknown> | null {
  if (!settings || typeof settings !== 'object') return null
  const src = settings as Record<string, unknown>
  const out: Record<string, unknown> = { ...src }

  if (Array.isArray(src.video_scenes)) {
    out.video_scenes = src.video_scenes.map((scene) => {
      if (!scene || typeof scene !== 'object') return scene
      const { audioDataURL: _audio, ...rest } = scene as Record<string, unknown>
      return rest
    })
  }

  if (Array.isArray(src.podcast_dialogue)) {
    out.podcast_dialogue = src.podcast_dialogue.map((seg) => {
      if (!seg || typeof seg !== 'object') return seg
      const { audioDataURL: _audio, ...rest } = seg as Record<string, unknown>
      return rest
    })
  }

  return out
}

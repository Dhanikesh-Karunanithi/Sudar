'use client'

import { useRef, useState } from 'react'
import { ImageIcon, Loader2, Trash2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SudarCourseBannerArt, SudarCourseThumbnailArt } from '@/components/branding/SudarCourseDefaultArt'
import { CourseArtPatternSelect } from '@/components/branding/CourseArtPatternSelect'

type Props = {
  courseId: string
  thumbnailUrl: string | null
  bannerUrl: string | null
  previewTitle: string
  previewDifficulty: string | null
  previewDurationMins: number | null
  previewModuleCount: number | null
  onUrlsChange: (next: { thumbnail_url: string | null; banner_url: string | null }) => void
}

export function CourseAppearancePanel({
  courseId,
  thumbnailUrl,
  bannerUrl,
  previewTitle,
  previewDifficulty,
  previewDurationMins,
  previewModuleCount,
  onUrlsChange,
}: Props) {
  const thumbInput = useRef<HTMLInputElement>(null)
  const bannerInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'thumb' | 'banner' | 'clear-thumb' | 'clear-banner' | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  async function patchCourse(body: { thumbnail_url?: string | null; banner_url?: string | null }) {
    const res = await fetch(`/api/courses/${courseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(data.error ?? 'Could not save')
    }
  }

  async function handleFile(kind: 'thumb' | 'banner', file: File | undefined) {
    if (!file) return
    setLocalError(null)
    setBusy(kind === 'thumb' ? 'thumb' : 'banner')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('course_id', courseId)
      const res = await fetch('/api/media/upload', { method: 'POST', body: form })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'Upload failed')
      }
      const { url } = (await res.json()) as { url: string }
      const body = kind === 'thumb' ? { thumbnail_url: url } : { banner_url: url }
      await patchCourse(body)
      onUrlsChange(
        kind === 'thumb'
          ? { thumbnail_url: url, banner_url: bannerUrl }
          : { thumbnail_url: thumbnailUrl, banner_url: url }
      )
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(null)
      if (kind === 'thumb' && thumbInput.current) thumbInput.current.value = ''
      if (kind === 'banner' && bannerInput.current) bannerInput.current.value = ''
    }
  }

  async function clearField(field: 'thumbnail_url' | 'banner_url') {
    setLocalError(null)
    setBusy(field === 'thumbnail_url' ? 'clear-thumb' : 'clear-banner')
    try {
      await patchCourse({ [field]: null })
      onUrlsChange(
        field === 'thumbnail_url'
          ? { thumbnail_url: null, banner_url: bannerUrl }
          : { thumbnail_url: thumbnailUrl, banner_url: null }
      )
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Could not clear')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 space-y-4" aria-label="Course appearance">
      <div className="flex items-center gap-2 text-slate-200">
        <ImageIcon className="w-4 h-4 text-indigo-400" aria-hidden />
        <h2 className="text-sm font-semibold">Catalog images</h2>
      </div>
      {localError ? (
        <p className="text-sm text-red-400" role="alert">
          {localError}
        </p>
      ) : null}
      <p className="text-xs text-slate-500">
        Thumbnail is used on course cards; banner appears on the course page header in Learn. If you don&apos;t upload
        images, Sudar shows a generated glass design with your course title. Custom images are stored in your
        organisation&apos;s media bucket.
      </p>
      <CourseArtPatternSelect id="studio-course-appearance-art-pattern" className="rounded-lg border border-slate-700/80 bg-slate-800/40 px-3 py-3" />
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400">Thumbnail</p>
          <div
            className={cn(
              'relative rounded-lg border border-slate-700 bg-slate-800/80 overflow-hidden',
              'aspect-video max-h-40'
            )}
          >
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="Course thumbnail" className="h-full w-full object-cover" />
            ) : (
              <SudarCourseThumbnailArt
                courseId={courseId}
                title={previewTitle}
                difficulty={previewDifficulty}
                estimatedDurationMins={previewDurationMins}
                moduleCount={previewModuleCount}
                embed
                className="absolute inset-0 min-h-0"
              />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={thumbInput}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => void handleFile('thumb', e.target.files?.[0])}
              aria-label="Upload thumbnail image"
            />
            <button
              type="button"
              onClick={() => thumbInput.current?.click()}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              {busy === 'thumb' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Upload className="h-3.5 w-3.5" aria-hidden />
              )}
              Upload
            </button>
            {thumbnailUrl ? (
              <button
                type="button"
                onClick={() => void clearField('thumbnail_url')}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                aria-label="Remove thumbnail"
              >
                {busy === 'clear-thumb' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                )}
                Remove
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400">Banner</p>
          <div
            className={cn(
              'relative rounded-lg border border-slate-700 bg-slate-800/80 overflow-hidden',
              'aspect-[21/9] max-h-36'
            )}
          >
            {bannerUrl ? (
              <img src={bannerUrl} alt="Course banner" className="h-full w-full object-cover" />
            ) : (
              <SudarCourseBannerArt
                courseId={courseId}
                title={previewTitle}
                difficulty={previewDifficulty}
                estimatedDurationMins={previewDurationMins}
                moduleCount={previewModuleCount}
                embed
                className="absolute inset-0 min-h-0"
              />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={bannerInput}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => void handleFile('banner', e.target.files?.[0])}
              aria-label="Upload banner image"
            />
            <button
              type="button"
              onClick={() => bannerInput.current?.click()}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              {busy === 'banner' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Upload className="h-3.5 w-3.5" aria-hidden />
              )}
              Upload
            </button>
            {bannerUrl ? (
              <button
                type="button"
                onClick={() => void clearField('banner_url')}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                aria-label="Remove banner"
              >
                {busy === 'clear-banner' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                )}
                Remove
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

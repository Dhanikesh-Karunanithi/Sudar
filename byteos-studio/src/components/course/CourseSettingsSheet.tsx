'use client'

import Link from 'next/link'
import { X, Zap, Users, Palette, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'
import { LEARNING_PERSONAS, type LearningPersonaSlug } from '@/lib/themes/learningPersonas'
import type { VideoScene, DialogueSegment } from '@/types/content'

type PersonalizationAudience = 'org' | 'groups' | 'individuals'

interface CoursePersonalizationSettings {
  audience?: PersonalizationAudience
  group_ids?: string[]
  user_ids?: string[]
  features?: {
    course_welcome?: boolean
    module_role_explain?: boolean
    module_brief?: boolean
  }
}

export interface CourseSettingsSheetCourse {
  id: string
  title: string
  description: string | null
  status: string
  difficulty: string | null
  estimated_duration_mins: number | null
  is_adaptive: boolean
  template?: string | null
  settings?: {
    module_completion?: Record<string, { type: 'mark_button' | 'min_time'; min_time_secs?: number }>
    include_video?: boolean
    include_podcast?: boolean
    video_scenes?: VideoScene[]
    podcast_dialogue?: DialogueSegment[]
    video_generation_status?: 'idle' | 'generating' | 'script_ready' | 'complete' | 'failed'
    podcast_generation_status?: 'idle' | 'generating' | 'complete' | 'failed'
    personalization?: CoursePersonalizationSettings
  } | null
  modules: { id: string }[]
}

export interface CourseSettingsSheetProps {
  open: boolean
  onClose: () => void
  course: CourseSettingsSheetCourse
  isPublished: boolean
  saveCourse: (updates: Partial<CourseSettingsSheetCourse>) => Promise<void>
  patchCoursePersonalization: (partial: Partial<CoursePersonalizationSettings>) => void
  learnerGroups: Array<{ id: string; name: string }>
  orgLearners: Array<{ id: string; full_name: string }>
  generatingVideo: boolean
  generatingPodcast: boolean
  videoGenStep: 'script' | 'audio' | null
  podcastGenStep: 'script' | 'audio' | null
  generateVideoScriptAndAudio: (courseId: string) => Promise<void>
  generatePodcastScriptAndAudio: (courseId: string) => Promise<void>
  handleVideoToggle: (enabled: boolean) => Promise<void>
  handlePodcastToggle: (enabled: boolean) => Promise<void>
  setViewMediaSheet: (v: 'video' | 'podcast' | null) => void
}

export function CourseSettingsSheet({
  open,
  onClose,
  course,
  isPublished,
  saveCourse,
  patchCoursePersonalization,
  learnerGroups,
  orgLearners,
  generatingVideo,
  generatingPodcast,
  videoGenStep,
  podcastGenStep,
  generateVideoScriptAndAudio,
  generatePodcastScriptAndAudio,
  handleVideoToggle,
  handlePodcastToggle,
  setViewMediaSheet,
}: CourseSettingsSheetProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close settings"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-lg flex-col border-l border-white/[0.06] bg-zinc-950 shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] p-4">
          <h2 className="text-sm font-semibold text-zinc-100">Course settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                isPublished
                  ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                  : 'bg-slate-700 text-slate-300'
              )}
            >
              {isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs text-slate-500 font-medium">Title</span>
              <input
                type="text"
                defaultValue={course.title}
                key={course.title}
                onBlur={(e) => {
                  if (e.target.value !== course.title) saveCourse({ title: e.target.value })
                }}
                className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/80 px-3 py-2 text-lg font-semibold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                placeholder="Course title"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-slate-500 font-medium">Description</span>
              <textarea
                defaultValue={course.description ?? ''}
                key={course.description ?? ''}
                onBlur={(e) => saveCourse({ description: e.target.value || null })}
                rows={3}
                placeholder="Add a description..."
                className="w-full resize-none rounded-xl border border-white/[0.08] bg-zinc-900/80 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
              />
            </label>
            <div className="flex items-center gap-6 pt-1">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium">Difficulty</label>
                <select
                  value={course.difficulty ?? 'intermediate'}
                  onChange={(e) => saveCourse({ difficulty: e.target.value })}
                  className="rounded-xl border border-white/[0.08] bg-zinc-900/80 px-2.5 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium">Duration (mins)</label>
                <input
                  type="number"
                  defaultValue={course.estimated_duration_mins ?? ''}
                  key={String(course.estimated_duration_mins)}
                  onBlur={(e) =>
                    saveCourse({ estimated_duration_mins: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder="e.g. 30"
                  className="w-24 rounded-xl border border-white/[0.08] bg-zinc-900/80 px-2.5 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-white/[0.06] pt-4">
            <button
              type="button"
              onClick={() => saveCourse({ is_adaptive: !course.is_adaptive })}
              className={cn(
                'flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all',
                course.is_adaptive
                  ? 'border-blue-500/25 bg-blue-500/[0.07] hover:border-blue-400/35'
                  : 'border-white/[0.08] bg-zinc-900/40 hover:border-white/[0.12]'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                  course.is_adaptive
                    ? 'border-blue-500/30 bg-blue-500/15'
                    : 'border-white/[0.08] bg-zinc-800'
                )}
              >
                <Zap className={cn('h-5 w-5', course.is_adaptive ? 'text-blue-300' : 'text-zinc-500')} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      course.is_adaptive ? 'text-zinc-100' : 'text-zinc-300'
                    )}
                  >
                    Adaptive personalization
                  </p>
                  {course.is_adaptive && (
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-200">
                      ON
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {course.is_adaptive
                    ? 'Learners opt in inside Sudar Learn. Sudar can add a course welcome and optional per-module helpers using their profile — canonical module content is never overwritten.'
                    : 'Turn on to allow opt-in AI personalization for this course (subject to org policy and audience you configure below).'}
                </p>
              </div>
              <div
                className={cn(
                  'mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-full px-0.5 transition-all',
                  course.is_adaptive ? 'justify-end bg-blue-600' : 'justify-start bg-zinc-700'
                )}
              >
                <div className="h-5 w-5 rounded-full bg-white shadow-sm" />
              </div>
            </button>

            {course.is_adaptive &&
              (() => {
                const p = course.settings?.personalization ?? {}
                const aud: PersonalizationAudience = p.audience ?? 'org'
                const gids = new Set(p.group_ids ?? [])
                const uids = new Set(p.user_ids ?? [])
                const fw = p.features?.course_welcome !== false
                const fRole = p.features?.module_role_explain !== false
                const fBrief = p.features?.module_brief !== false
                return (
                  <div className="ml-0 space-y-4 rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-4 sm:ml-2">
                    <p className="text-[10px] text-zinc-500">
                      Org-wide AI limits and learner consent live in{' '}
                      <Link href="/settings" className="text-blue-400 hover:underline">
                        Settings
                      </Link>
                      .
                    </p>
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-2">What learners may use</p>
                      <div className="space-y-2">
                        {(
                          [
                            ['course_welcome', 'Course welcome (opt-in)', fw],
                            ['module_role_explain', 'Explain this module for my role', fRole],
                            ['module_brief', '3-minute version', fBrief],
                          ] as const
                        ).map(([key, label, on]) => (
                          <label key={key} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() =>
                                patchCoursePersonalization({
                                  features: {
                                    course_welcome: key === 'course_welcome' ? !on : fw,
                                    module_role_explain: key === 'module_role_explain' ? !on : fRole,
                                    module_brief: key === 'module_brief' ? !on : fBrief,
                                  },
                                })
                              }
                              className="rounded border-slate-600"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-2">Who can personalize</p>
                      <div className="space-y-2">
                        {(
                          [
                            ['org', 'Everyone in your org (enrolled learners)'],
                            ['groups', 'Only selected learner groups'],
                            ['individuals', 'Only selected individuals'],
                          ] as const
                        ).map(([value, lab]) => (
                          <label key={value} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="radio"
                              name="pers-audience-sheet"
                              checked={aud === value}
                              onChange={() => {
                                if (value === 'org') {
                                  patchCoursePersonalization({ audience: 'org', group_ids: [], user_ids: [] })
                                } else if (value === 'groups') {
                                  patchCoursePersonalization({
                                    audience: 'groups',
                                    user_ids: [],
                                    group_ids: p.group_ids ?? [],
                                  })
                                } else {
                                  patchCoursePersonalization({
                                    audience: 'individuals',
                                    group_ids: [],
                                    user_ids: p.user_ids ?? [],
                                  })
                                }
                              }}
                              className="border-slate-600"
                            />
                            {lab}
                          </label>
                        ))}
                      </div>
                    </div>
                    {aud === 'groups' && (
                      <div>
                        <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> Groups (manage under org tools / API)
                        </p>
                        {learnerGroups.length === 0 ? (
                          <p className="text-[10px] text-slate-600">
                            No groups yet. Create groups via Studio API or future Groups UI.
                          </p>
                        ) : (
                          <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-700 rounded-lg p-2">
                            {learnerGroups.map((g) => (
                              <label key={g.id} className="flex items-center gap-2 text-xs text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={gids.has(g.id)}
                                  onChange={() => {
                                    const next = new Set(gids)
                                    if (next.has(g.id)) next.delete(g.id)
                                    else next.add(g.id)
                                    patchCoursePersonalization({ group_ids: [...next] })
                                  }}
                                  className="rounded border-slate-600"
                                />
                                {g.name}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {aud === 'individuals' && (
                      <div>
                        <p className="text-xs text-slate-500 mb-2">Org members</p>
                        <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-700 rounded-lg p-2">
                          {orgLearners.map((u) => (
                            <label key={u.id} className="flex items-center gap-2 text-xs text-slate-300">
                              <input
                                type="checkbox"
                                checked={uids.has(u.id)}
                                onChange={() => {
                                  const next = new Set(uids)
                                  if (next.has(u.id)) next.delete(u.id)
                                  else next.add(u.id)
                                  patchCoursePersonalization({ user_ids: [...next] })
                                }}
                                className="rounded border-slate-600"
                              />
                              {u.full_name}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
          </div>

          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-xs font-medium text-slate-400">Visual persona</span>
            </div>
            <p className="text-[10px] text-slate-600 mb-3">
              Choose how this course looks to learners. Affects typography, colors, and card style in Sudar Learn.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => saveCourse({ template: null })}
                className={cn(
                  'flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all',
                  !course.template
                    ? 'bg-slate-700 border-slate-500 ring-1 ring-slate-400'
                    : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                )}
              >
                <div className="w-full h-8 rounded border border-slate-600 bg-slate-900 flex items-center justify-center">
                  <span className="text-[10px] text-slate-500">Default</span>
                </div>
                <span className="text-xs font-medium text-slate-300">Platform default</span>
              </button>
              {(Object.keys(LEARNING_PERSONAS) as LearningPersonaSlug[]).map((slug) => {
                const pers = LEARNING_PERSONAS[slug]
                const selected = course.template === slug
                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => saveCourse({ template: slug })}
                    className={cn(
                      'flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all',
                      selected
                        ? 'border-blue-500/40 bg-blue-500/[0.08] ring-1 ring-blue-500/35'
                        : 'border-white/[0.08] bg-zinc-900/50 hover:border-white/[0.12]'
                    )}
                  >
                    <div
                      className="w-full h-8 rounded border flex items-center justify-center text-[10px] font-medium"
                      style={{
                        backgroundColor: pers.colorBackground,
                        color: pers.colorForeground,
                        borderColor: pers.borderColor,
                      }}
                    >
                      {pers.label}
                    </div>
                    <span className="text-xs font-medium text-slate-300">{pers.label}</span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{pers.bestFor[0]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div id="video-podcast-section" className="space-y-3 border-t border-white/[0.06] pt-4">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-xs font-medium text-slate-400">Video &amp; Podcast</span>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={course.settings?.include_video ?? false}
                  disabled={generatingVideo || !course.modules?.length}
                  onChange={(e) => handleVideoToggle(e.target.checked)}
                  className="rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500 disabled:opacity-50"
                />
                Include video overview
              </label>
              {course.settings?.include_video && (
                <div className="ml-6 text-[11px]">
                  {generatingVideo ? (
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <SudarInlineLoader size="sm" className="h-3 w-auto text-slate-500" starFill="var(--background)" />
                      {videoGenStep === 'script' ? 'Generating script…' : 'Generating audio…'}
                    </span>
                  ) : (course.settings?.video_scenes?.length ?? 0) > 0 ? (
                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-green-400">
                        ✓ Ready — {course.settings!.video_scenes!.length} scenes
                        {course.settings!.video_scenes!.some((s) => s.audioDataURL)
                          ? ', audio generated'
                          : ' (no audio yet)'}
                      </span>
                      <button
                        type="button"
                        disabled={generatingVideo || generatingPodcast}
                        onClick={() => generateVideoScriptAndAudio(course.id)}
                        className="text-slate-500 hover:text-slate-300 underline underline-offset-2 disabled:opacity-40"
                      >
                        Regenerate
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMediaSheet('video')}
                        className="block mt-1 text-slate-500 hover:text-slate-300 underline underline-offset-2"
                      >
                        View scenes
                      </button>
                    </div>
                  ) : !course.modules?.length ? (
                    <span className="text-amber-600">Add modules with content first</span>
                  ) : (
                    <span className="text-slate-600">Pending generation…</span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={course.settings?.include_podcast ?? false}
                  disabled={generatingPodcast || !course.modules?.length}
                  onChange={(e) => handlePodcastToggle(e.target.checked)}
                  className="rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500 disabled:opacity-50"
                />
                Include podcast
              </label>
              {course.settings?.include_podcast && (
                <div className="ml-6 text-[11px]">
                  {generatingPodcast ? (
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <SudarInlineLoader size="sm" className="h-3 w-auto text-slate-500" starFill="var(--background)" />
                      {podcastGenStep === 'script' ? 'Generating script…' : 'Generating audio…'}
                    </span>
                  ) : (course.settings?.podcast_dialogue?.length ?? 0) > 0 ? (
                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-green-400">
                        ✓ Ready — {course.settings!.podcast_dialogue!.length} segments
                        {course.settings!.podcast_dialogue!.some((s) => s.audioDataURL)
                          ? ', audio generated'
                          : ' (no audio yet)'}
                      </span>
                      <button
                        type="button"
                        disabled={generatingVideo || generatingPodcast}
                        onClick={() => generatePodcastScriptAndAudio(course.id)}
                        className="text-slate-500 hover:text-slate-300 underline underline-offset-2 disabled:opacity-40"
                      >
                        Regenerate
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMediaSheet('podcast')}
                        className="block mt-1 text-slate-500 hover:text-slate-300 underline underline-offset-2"
                      >
                        View dialogue
                      </button>
                    </div>
                  ) : !course.modules?.length ? (
                    <span className="text-amber-600">Add modules with content first</span>
                  ) : (
                    <span className="text-slate-600">Pending generation…</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

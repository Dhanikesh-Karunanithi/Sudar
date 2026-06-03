'use client'

import type { BrandColors, ContentDensity, CourseTypeSlug, ThemePreference } from '@/lib/ai/courseGeneration/types'

export interface BrandSettingsValue {
  course_type: CourseTypeSlug
  theme_preference: ThemePreference
  brand_colors: BrandColors
  tone_preference: string
  content_density: ContentDensity
  vary_introductions: boolean
  minimize_sidecards: boolean
  strict_component_validation: boolean
  apply_quality_filtering: boolean
}

export const DEFAULT_BRAND_SETTINGS: BrandSettingsValue = {
  course_type: 'general',
  theme_preference: 'calora_editorial',
  brand_colors: { primary: '#4a90e2', accent: '#50c9c3' },
  tone_preference: 'professional',
  content_density: 'balanced',
  vary_introductions: true,
  minimize_sidecards: true,
  strict_component_validation: true,
  apply_quality_filtering: true,
}

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'calora_editorial', label: 'Calora Editorial — premium, editorial' },
  { value: 'minimal_modern', label: 'Minimal Modern — clean, flat' },
  { value: 'vibrant_interactive', label: 'Vibrant Interactive — colorful, energetic' },
  { value: 'data_visualization', label: 'Data Visualization — analytical' },
  { value: 'dark_academic', label: 'Dark Academic — professional dark' },
  { value: 'immersive_storytelling', label: 'Immersive Storytelling — narrative-led' },
]

const COURSE_TYPES: { value: CourseTypeSlug; label: string }[] = [
  { value: 'programming', label: 'Programming & engineering' },
  { value: 'product_strategy', label: 'Product & strategy' },
  { value: 'data_science', label: 'Data science & analytics' },
  { value: 'compliance', label: 'Compliance & policy' },
  { value: 'soft_skills', label: 'Soft skills & leadership' },
  { value: 'general', label: 'General / mixed' },
]

interface BrandSettingsProps {
  value: BrandSettingsValue
  onChange: (next: BrandSettingsValue) => void
}

export function BrandSettings({ value, onChange }: BrandSettingsProps) {
  const patch = (partial: Partial<BrandSettingsValue>) => onChange({ ...value, ...partial })

  return (
    <div className="space-y-6 rounded-xl border border-zinc-800 bg-black/75 p-5">
      <div>
        <h3 className="text-sm font-semibold text-white">Visual identity & generation quality</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Controls how Sudar designs lessons — domain, theme, density, and quality gates.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-zinc-300 mb-1 block">Course domain</span>
          <select
            value={value.course_type}
            onChange={(e) => patch({ course_type: e.target.value as CourseTypeSlug })}
            className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
          >
            {COURSE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-zinc-300 mb-1 block">Experience theme</span>
          <select
            value={value.theme_preference}
            onChange={(e) => patch({ theme_preference: e.target.value as ThemePreference })}
            className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
          >
            {THEMES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-zinc-300 mb-1 block">Primary brand color</span>
          <input
            type="color"
            value={value.brand_colors.primary}
            onChange={(e) =>
              patch({ brand_colors: { ...value.brand_colors, primary: e.target.value } })
            }
            className="h-10 w-full rounded-lg border border-zinc-800 bg-black cursor-pointer"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-300 mb-1 block">Accent color</span>
          <input
            type="color"
            value={value.brand_colors.accent}
            onChange={(e) =>
              patch({ brand_colors: { ...value.brand_colors, accent: e.target.value } })
            }
            className="h-10 w-full rounded-lg border border-zinc-800 bg-black cursor-pointer"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-zinc-300 mb-1 block">Voice & tone</span>
          <select
            value={value.tone_preference}
            onChange={(e) => patch({ tone_preference: e.target.value })}
            className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
          >
            <option value="professional">Professional</option>
            <option value="conversational">Conversational</option>
            <option value="academic">Academic</option>
            <option value="energetic">Energetic</option>
            <option value="coaching">Coaching / supportive</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-zinc-300 mb-1 block">Content density</span>
          <select
            value={value.content_density}
            onChange={(e) => patch({ content_density: e.target.value as ContentDensity })}
            className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
          >
            <option value="concise">Concise</option>
            <option value="balanced">Balanced</option>
            <option value="detailed">Detailed</option>
          </select>
        </label>
      </div>

      <div className="space-y-2 border-t border-zinc-800 pt-4">
        {(
          [
            ['vary_introductions', 'Vary introductions by domain (avoid repetitive scenarios)'],
            ['minimize_sidecards', 'Hide side insights by default (floating hotspot)'],
            ['strict_component_validation', 'Reject empty or low-value interactives'],
            ['apply_quality_filtering', 'Run instructional quality scoring'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-start gap-3 text-sm text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={value[key]}
              onChange={(e) => patch({ [key]: e.target.checked })}
              className="mt-0.5 rounded border-zinc-700 bg-black"
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  )
}

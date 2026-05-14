'use client'

import { useEffect, useState } from 'react'
import { Settings2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { BentoCard } from '@/components/ui/BentoCard'
import { LanguageSelector } from '@/components/settings/LanguageSelector'
import type { ResolvedLearnerPreferences, TutorPedagogyMode } from '@/lib/learner/learnerPreferences'

const boolKeys: (keyof ResolvedLearnerPreferences)[] = [
  'proactive_nudges_enabled',
  'idle_nudges',
  'route_prompts',
  'session_start_prompts',
  'module_bridge_prompts',
  'supplemental_practice_offers',
  'memory_digest_enabled',
  'infer_modality_matrix',
  'stuck_detection_tutor',
  'stuck_detection_nudges',
]

const BOOL_I18N: Record<
  (typeof boolKeys)[number],
  { title: string; hint: string }
> = {
  proactive_nudges_enabled: { title: 'proactiveMasterTitle', hint: 'proactiveMasterHint' },
  idle_nudges: { title: 'idleNudgesTitle', hint: 'idleNudgesHint' },
  route_prompts: { title: 'routePromptsTitle', hint: 'routePromptsHint' },
  session_start_prompts: { title: 'sessionStartTitle', hint: 'sessionStartHint' },
  module_bridge_prompts: { title: 'moduleBridgeTitle', hint: 'moduleBridgeHint' },
  supplemental_practice_offers: { title: 'supplementalTitle', hint: 'supplementalHint' },
  memory_digest_enabled: { title: 'memoryDigestTitle', hint: 'memoryDigestHint' },
  infer_modality_matrix: { title: 'inferModalityTitle', hint: 'inferModalityHint' },
  stuck_detection_tutor: { title: 'stuckTutorTitle', hint: 'stuckTutorHint' },
  stuck_detection_nudges: { title: 'stuckNudgesTitle', hint: 'stuckNudgesHint' },
}

export function LearningPreferencesPanel() {
  const t = useTranslations('Memory')
  const tc = useTranslations('Common')
  const [prefs, setPrefs] = useState<ResolvedLearnerPreferences | null>(null)
  const [orgDefaultUi, setOrgDefaultUi] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetch('/api/learner/preferences')
      .then((r) => r.json())
      .then((d) => {
        if (d.preferences) setPrefs(d.preferences as ResolvedLearnerPreferences)
        if (typeof d.org_default_ui_locale === 'string') setOrgDefaultUi(d.org_default_ui_locale)
      })
      .catch(() => setError(tc('couldNotLoad')))
  }, [tc])

  async function patch(partial: Record<string, unknown>) {
    setSaving(true)
    setError(null)
    const res = await fetch('/api/learner/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) {
      setError((data as { error?: string }).error ?? tc('saveFailed'))
      return
    }
    if (data.preferences) setPrefs(data.preferences as ResolvedLearnerPreferences)
  }

  if (!prefs) {
    return (
      <BentoCard padding="md" className="rounded-5xl text-sm text-muted-foreground">
        {t('loadingPrefs')}
      </BentoCard>
    )
  }

  return (
    <div className="space-y-4">
      <LanguageSelector
        uiLanguage={prefs.ui_language}
        contentLanguage={prefs.content_language}
        autoDetectLanguage={prefs.auto_detect_language}
        orgDefaultUiLocale={orgDefaultUi}
        disabled={saving}
        onPatch={patch}
      />

      <div className="flex items-center gap-2">
        <Settings2 className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-card-foreground">{t('learningPreferences')}</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-pill">{t('youControl')}</span>
      </div>
      <p className="text-xs text-muted-foreground">{t('intro')}</p>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <BentoCard padding="md" className="rounded-5xl space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-card-foreground" htmlFor="pedagogy">
            {t('pedagogyTitle')}
          </label>
          <p className="text-xs text-muted-foreground">{t('pedagogyHint')}</p>
          <select
            id="pedagogy"
            disabled={saving}
            className="mt-1 w-full max-w-md rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={prefs.tutor_pedagogy_default}
            onChange={(e) => void patch({ tutor_pedagogy_default: e.target.value as TutorPedagogyMode })}
          >
            <option value="explain">{t('pedagogyExplain')}</option>
            <option value="guide">{t('pedagogyGuide')}</option>
            <option value="exam_focus">{t('pedagogyExam')}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-card-foreground" htmlFor="mem-cadence">
            {t('memoryLlmTitle')}
          </label>
          <p className="text-xs text-muted-foreground">{t('memoryLlmHint')}</p>
          <select
            id="mem-cadence"
            disabled={saving}
            className="mt-1 w-full max-w-md rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={prefs.tutor_memory_llm_cadence}
            onChange={(e) =>
              void patch({
                tutor_memory_llm_cadence: e.target.value as ResolvedLearnerPreferences['tutor_memory_llm_cadence'],
              })
            }
          >
            <option value="every_message">{t('memoryLlmEvery')}</option>
            <option value="daily">{t('memoryLlmDaily')}</option>
            <option value="weekly">{t('memoryLlmWeekly')}</option>
            <option value="off">{t('memoryLlmOff')}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-card-foreground" htmlFor="digest-days">
            {t('digestDaysTitle')}
          </label>
          <p className="text-xs text-muted-foreground">{t('digestDaysHint')}</p>
          <select
            id="digest-days"
            disabled={saving || !prefs.memory_digest_enabled}
            className="mt-1 w-full max-w-md rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
            value={String(prefs.memory_digest_cadence_days)}
            onChange={(e) => void patch({ memory_digest_cadence_days: Number(e.target.value) as 1 | 7 | 30 })}
          >
            <option value="1">{t('digest1')}</option>
            <option value="7">{t('digest7')}</option>
            <option value="30">{t('digest30')}</option>
          </select>
        </div>

        {boolKeys.map((key) => {
          const meta = BOOL_I18N[key]
          if (!meta) return null
          return (
            <label
              key={key}
              className="flex items-start gap-3 cursor-pointer rounded-lg border border-transparent p-2 hover:bg-muted/50"
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={Boolean(prefs[key])}
                disabled={saving}
                onChange={(e) => void patch({ [key]: e.target.checked })}
              />
              <span>
                <span className="text-sm font-medium text-card-foreground block">{t(meta.title)}</span>
                <span className="text-xs text-muted-foreground">{t(meta.hint)}</span>
              </span>
            </label>
          )
        })}
      </BentoCard>
    </div>
  )
}

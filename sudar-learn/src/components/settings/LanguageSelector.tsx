'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LOCALE_OPTIONS, type AppLocale } from '../../../../shared/i18nLocales'

const COOKIE = 'NEXT_LOCALE'
const ONE_YEAR = 60 * 60 * 24 * 365

export type LanguageSelectorProps = {
  /** Resolved learner preferences (from /api/learner/preferences). */
  uiLanguage: AppLocale
  contentLanguage: AppLocale
  autoDetectLanguage: boolean
  /** Organisation default when learner has not customised UI yet (optional). */
  orgDefaultUiLocale?: string | null
  disabled?: boolean
  onPatch: (partial: Record<string, unknown>) => Promise<void>
}

export function LanguageSelector({
  uiLanguage,
  contentLanguage,
  autoDetectLanguage,
  orgDefaultUiLocale,
  disabled,
  onPatch,
}: LanguageSelectorProps) {
  const t = useTranslations('Language')
  const router = useRouter()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return [...LOCALE_OPTIONS]
    return LOCALE_OPTIONS.filter(
      (o) =>
        o.code.toLowerCase().includes(s)
        || o.labelEn.toLowerCase().includes(s)
        || o.labelNative.toLowerCase().includes(s),
    )
  }, [q])

  function setUiCookie(locale: string) {
    if (typeof document === 'undefined') return
    document.cookie = `${COOKIE}=${encodeURIComponent(locale)}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`
  }

  async function changeUi(locale: AppLocale) {
    setUiCookie(locale)
    await onPatch({ ui_language: locale })
    router.refresh()
  }

  async function changeContent(locale: AppLocale) {
    await onPatch({ content_language: locale })
  }

  async function toggleAuto(v: boolean) {
    await onPatch({ auto_detect_language: v })
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div>
        <h3 className="text-sm font-semibold text-card-foreground">{t('sectionTitle')}</h3>
        <p className="text-xs text-muted-foreground mt-1">{t('sectionHint')}</p>
        {orgDefaultUiLocale ? (
          <p className="text-[11px] text-muted-foreground mt-2">
            {t('orgDefaultHint', { locale: orgDefaultUiLocale })}
          </p>
        ) : null}
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground" htmlFor="lang-search">
          {t('searchPlaceholder')}
        </label>
        <input
          id="lang-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          disabled={disabled}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-card-foreground" htmlFor="ui-lang">
          {t('uiLanguage')}
        </label>
        <p className="text-xs text-muted-foreground">{t('uiLanguageHint')}</p>
        <select
          id="ui-lang"
          disabled={disabled}
          className="mt-1 w-full max-w-md rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={uiLanguage}
          onChange={(e) => void changeUi(e.target.value as AppLocale)}
        >
          {filtered.map((o) => (
            <option key={o.code} value={o.code}>
              {o.flag} {o.labelNative} ({o.labelEn})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-card-foreground" htmlFor="content-lang">
          {t('contentLanguage')}
        </label>
        <p className="text-xs text-muted-foreground">{t('contentLanguageHint')}</p>
        <select
          id="content-lang"
          disabled={disabled}
          className="mt-1 w-full max-w-md rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={contentLanguage}
          onChange={(e) => void changeContent(e.target.value as AppLocale)}
        >
          {filtered.map((o) => (
            <option key={`c-${o.code}`} value={o.code}>
              {o.flag} {o.labelNative} ({o.labelEn})
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-transparent p-2 hover:bg-muted/50">
        <input
          type="checkbox"
          className="mt-1"
          checked={autoDetectLanguage}
          disabled={disabled}
          onChange={(e) => void toggleAuto(e.target.checked)}
        />
        <span>
          <span className="text-sm font-medium text-card-foreground block">{t('autoDetect')}</span>
          <span className="text-xs text-muted-foreground">{t('autoDetectHint')}</span>
        </span>
      </label>
    </div>
  )
}

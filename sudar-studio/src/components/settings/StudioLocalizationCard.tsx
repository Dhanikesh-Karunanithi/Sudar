'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Globe2 } from 'lucide-react'
import { LOCALE_OPTIONS, clampAppLocale, type AppLocale } from '../../../../shared/i18nLocales'

const COOKIE = 'NEXT_LOCALE'
const ONE_YEAR = 60 * 60 * 24 * 365

function readUiCookie(): AppLocale {
  if (typeof document === 'undefined') return 'en'
  const m = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]*)/)
  const raw = m?.[1] ? decodeURIComponent(m[1]) : ''
  return clampAppLocale(raw || 'en')
}

function setUiCookie(locale: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE}=${encodeURIComponent(locale)}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`
}

export type StudioLocalizationCardProps = {
  orgDefaultLearnerUi: string
  onOrgDefaultLearnerUiChange: (code: string) => void
}

export function StudioLocalizationCard({
  orgDefaultLearnerUi,
  onOrgDefaultLearnerUiChange,
}: StudioLocalizationCardProps) {
  const t = useTranslations('StudioLocalization')
  const router = useRouter()
  const [studioUi, setStudioUi] = useState<AppLocale>('en')
  const [q, setQ] = useState('')

  useEffect(() => {
    setStudioUi(readUiCookie())
  }, [])

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

  function changeStudioUi(locale: AppLocale) {
    setUiCookie(locale)
    setStudioUi(locale)
    router.refresh()
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Globe2 className="w-4 h-4 text-slate-500" />
        <h2 className="font-semibold text-white">{t('cardTitle')}</h2>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500" htmlFor="studio-lang-search">
          {t('searchPlaceholder')}
        </label>
        <input
          id="studio-lang-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-white" htmlFor="studio-ui-lang">
          {t('studioUiTitle')}
        </label>
        <p className="text-xs text-slate-500">{t('studioUiHint')}</p>
        <select
          id="studio-ui-lang"
          className="mt-1 w-full max-w-md rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm"
          value={studioUi}
          onChange={(e) => changeStudioUi(e.target.value as AppLocale)}
        >
          {filtered.map((o) => (
            <option key={o.code} value={o.code}>
              {o.flag} {o.labelNative} ({o.labelEn})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-white" htmlFor="org-learn-ui-lang">
          {t('orgDefaultTitle')}
        </label>
        <p className="text-xs text-slate-500">{t('orgDefaultHint')}</p>
        <select
          id="org-learn-ui-lang"
          className="mt-1 w-full max-w-md rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm"
          value={orgDefaultLearnerUi}
          onChange={(e) => onOrgDefaultLearnerUiChange(e.target.value)}
        >
          <option value="">{t('orgDefaultNone')}</option>
          {filtered.map((o) => (
            <option key={`org-${o.code}`} value={o.code}>
              {o.flag} {o.labelNative} ({o.labelEn})
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-500 pt-1">{t('saveHint')}</p>
      </div>
    </section>
  )
}

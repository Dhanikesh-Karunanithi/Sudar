import type { ResolvedLearnerPreferences } from '@/lib/learner/learnerPreferences'
import { LOCALE_OPTIONS } from '../../../../shared/i18nLocales'

function englishNameForLocale(code: string): string {
  return LOCALE_OPTIONS.find((o) => o.code === code)?.labelEn ?? code
}

/** Short instruction block injected into tutor system prompts. */
export function buildTutorContentLanguageBlock(prefs: ResolvedLearnerPreferences): string {
  const code = prefs.content_language
  const name = englishNameForLocale(code)
  if (prefs.auto_detect_language) {
    return `[Language] Prefer the learner's message language when it is clear; otherwise use ${name} (locale ${code}).`
  }
  return `[Language] Always reply in ${name} (locale ${code}) unless the learner explicitly asks you to switch languages.`
}

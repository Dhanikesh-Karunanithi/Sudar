import type { AbstractIntlMessages } from 'next-intl'
import type { AppLocale } from './routing'
import { defaultLocale } from './routing'
import { clampAppLocale } from '../../../shared/i18nLocales'

import ar from '../messages/ar.json'
import bn from '../messages/bn.json'
import de from '../messages/de.json'
import en from '../messages/en.json'
import es from '../messages/es.json'
import fa from '../messages/fa.json'
import fr from '../messages/fr.json'
import gu from '../messages/gu.json'
import he from '../messages/he.json'
import hi from '../messages/hi.json'
import id from '../messages/id.json'
import it from '../messages/it.json'
import ja from '../messages/ja.json'
import kn from '../messages/kn.json'
import ko from '../messages/ko.json'
import mr from '../messages/mr.json'
import ms from '../messages/ms.json'
import ne from '../messages/ne.json'
import nl from '../messages/nl.json'
import pa from '../messages/pa.json'
import pl from '../messages/pl.json'
import pt from '../messages/pt.json'
import ru from '../messages/ru.json'
import sa from '../messages/sa.json'
import sw from '../messages/sw.json'
import ta from '../messages/ta.json'
import te from '../messages/te.json'
import th from '../messages/th.json'
import tr from '../messages/tr.json'
import uk from '../messages/uk.json'
import ur from '../messages/ur.json'
import vi from '../messages/vi.json'
import zhCN from '../messages/zh-CN.json'
import zhTW from '../messages/zh-TW.json'

const catalog: Record<AppLocale, AbstractIntlMessages> = {
  en,
  es,
  fr,
  ar,
  hi,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  de,
  pt,
  ru,
  ja,
  ko,
  tr,
  id,
  vi,
  pl,
  it,
  nl,
  bn,
  ta,
  te,
  ur,
  fa,
  he,
  sw,
  uk,
  ms,
  th,
  gu,
  pa,
  ne,
  mr,
  sa,
  kn,
}

export function loadMessagesSync(locale: string): AbstractIntlMessages {
  const safe = clampAppLocale(locale)
  return catalog[safe] ?? catalog[defaultLocale]
}

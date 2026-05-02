import { AiLiteracyCourseClient } from '@/components/help/AiLiteracyCourseClient'
import { loadAiLiteracyLessons } from '@/lib/helpCenter/server'

export const metadata = {
  title: 'Understanding AI in Sudar — Sudar Help Center',
}

export default function AiAtSudarCoursePage() {
  const lessons = loadAiLiteracyLessons()
  return <AiLiteracyCourseClient lessons={lessons} />
}

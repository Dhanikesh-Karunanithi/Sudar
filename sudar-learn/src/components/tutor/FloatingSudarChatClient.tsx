'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

const FloatingSudarChat = dynamic(
  () => import('@/components/tutor/FloatingSudarChat').then((m) => m.FloatingSudarChat),
  { ssr: false }
)

interface FloatingSudarChatClientProps {
  userId: string
}

export function FloatingSudarChatClient({ userId }: FloatingSudarChatClientProps) {
  const pathname = usePathname()
  const isLearningFocusRoute = /^\/courses\/[^/]+\/learn(?:\/|$)/.test(pathname)
  const isJourneyRoute = (pathname ?? '').includes('/journey')

  // Course learn has inline tutor; Journey mounts a docked SudarChatPanel instead.
  if (isLearningFocusRoute || isJourneyRoute) return null

  return <FloatingSudarChat userId={userId} />
}

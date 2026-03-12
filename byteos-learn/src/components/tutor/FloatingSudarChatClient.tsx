'use client'

import dynamic from 'next/dynamic'

const FloatingSudarChat = dynamic(
  () => import('@/components/tutor/FloatingSudarChat').then((m) => m.FloatingSudarChat),
  { ssr: false }
)

export function FloatingSudarChatClient() {
  return <FloatingSudarChat />
}

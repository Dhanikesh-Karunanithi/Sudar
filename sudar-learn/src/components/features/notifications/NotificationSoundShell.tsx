'use client'

import type { ReactNode } from 'react'
import { NotificationSoundProvider } from './NotificationSoundProvider'

export function NotificationSoundShell({ children }: { children: ReactNode }) {
  return <NotificationSoundProvider>{children}</NotificationSoundProvider>
}

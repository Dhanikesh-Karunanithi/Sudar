'use client'

import { useEffect } from 'react'

import {
  AUTH_INTENT_STORAGE_KEY,
  clearSignupAuthIntent,
  hasSignupAuthIntent,
} from '@shared-access/authIntent'

const STORAGE_KEY = 'sudar-pending-invite'

export function setPendingInvite(code: string) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEY, code)
    sessionStorage.setItem(AUTH_INTENT_STORAGE_KEY, 'signup')
  }
}

export function PendingInviteHandler() {
  useEffect(() => {
    if (!hasSignupAuthIntent()) return

    const code = sessionStorage.getItem(STORAGE_KEY)
    if (!code) return

    fetch('/api/invite/apply-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(() => {
        sessionStorage.removeItem(STORAGE_KEY)
        clearSignupAuthIntent()
      })
      .catch(() => {})
  }, [])

  return null
}

import { NextResponse } from 'next/server'

import { VERIFIED_INVITE_COOKIE } from '@shared-access/constants'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(VERIFIED_INVITE_COOKIE)
  return response
}

/**
 * POST /api/coins/earn
 *
 * Client minting is disabled. Coins/XP are awarded only by the server-side
 * gamification engine (`evaluateGamification` → direct ledger writes).
 */

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Client coin minting is disabled. Awards are granted by the gamification engine only.',
    },
    { status: 403 },
  )
}

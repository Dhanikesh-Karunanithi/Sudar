import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  void request
  return NextResponse.json(
    { error: 'SudarArt is temporarily disabled while we improve generation quality.' },
    { status: 503 }
  )
}

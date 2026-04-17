/**
 * Server-generated certificate PDF.
 * GET /api/certificates/[code]/pdf returns application/pdf for download.
 */
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import ReactPDF from '@react-pdf/renderer'
import { CertificatePDF } from './CertificatePDF'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const admin = createAdminClient()
  const { data: cert } = await admin
    .from('certifications')
    .select('*, path:learning_paths(title, courses)')
    .eq('verification_code', code)
    .single()

  if (!cert) return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })

  const pathTitle = cert.path_title ?? (cert.path as { title?: string } | null)?.title ?? 'Learning Path'
  const courseCount = Array.isArray((cert.path as { courses?: unknown[] } | null)?.courses)
    ? (cert.path as { courses: unknown[] }).courses.length
    : 0
  const issuedDate = new Date(cert.issued_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? 'https://byteos.app'
  const certificateUrl = cert.certificate_url ?? `${baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`}/cert/${code}`

  const buffer = await ReactPDF.renderToBuffer(
    React.createElement(CertificatePDF, {
      recipientName: cert.recipient_name ?? 'Learner',
      pathTitle,
      orgName: cert.org_name ?? 'Sudar',
      issuedDate,
      courseCount,
      verificationCode: code,
      certificateUrl,
    })
  )

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="sudar-certificate-${code.slice(0, 8)}.pdf"`,
    },
  })
}

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const BUCKET = 'avatars'
const MAX_BYTES = 2 * 1024 * 1024

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

function allowedMime(m: string): m is keyof typeof MIME_TO_EXT {
  return m in MIME_TO_EXT
}

/**
 * POST /api/profile/avatar — multipart form field `file`: replace profile photo.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData().catch(() => null)
  const file = formData?.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'Expected multipart field "file"' }, { status: 400 })
  }

  const mime = file.type
  if (!allowedMime(mime)) {
    return NextResponse.json(
      { success: false, error: 'Use JPEG, PNG, WebP, or GIF' },
      { status: 400 }
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ success: false, error: 'Image must be 2 MB or smaller' }, { status: 400 })
  }

  const ext = MIME_TO_EXT[mime]
  const path = `${user.id}/avatar.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const admin = createAdminClient()

  const { data: listed } = await admin.storage.from(BUCKET).list(user.id)
  if (listed?.length) {
    const toRemove = listed.map((f) => `${user.id}/${f.name}`)
    await admin.storage.from(BUCKET).remove(toRemove)
  }

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: true,
  })
  if (uploadError) {
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET).getPublicUrl(path)

  const bustUrl = `${publicUrl}?v=${Date.now()}`

  const { error: profileError } = await admin.from('profiles').update({ avatar_url: bustUrl }).eq('id', user.id)
  if (profileError) {
    return NextResponse.json({ success: false, error: 'Could not save profile' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: { avatar_url: bustUrl } })
}

/**
 * DELETE /api/profile/avatar — Remove photo and clear profiles.avatar_url.
 */
export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: listed } = await admin.storage.from(BUCKET).list(user.id)
  if (listed?.length) {
    const toRemove = listed.map((f) => `${user.id}/${f.name}`)
    await admin.storage.from(BUCKET).remove(toRemove)
  }

  const { error } = await admin.from('profiles').update({ avatar_url: null }).eq('id', user.id)
  if (error) {
    return NextResponse.json({ success: false, error: 'Could not update profile' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: { avatar_url: null } })
}

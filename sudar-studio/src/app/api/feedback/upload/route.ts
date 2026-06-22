import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'

const BUCKET = 'course-media'
const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'file required' }, { status: 400 })
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ success: false, error: 'File too large. Max 5MB.' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { fileTypeFromBuffer } = await import('file-type')
  const detected = await fileTypeFromBuffer(buffer)
  const mime = detected?.mime?.toLowerCase() ?? null
  if (!mime || !ALLOWED_IMAGE_TYPES.includes(mime)) {
    return NextResponse.json(
      { success: false, error: 'Invalid image. Use JPEG, PNG, GIF, or WebP.' },
      { status: 400 },
    )
  }

  const orgId = await getOrCreateOrg(user.id)
  const ext = mime.split('/')[1] ?? 'jpg'
  const path = `feedback/${orgId}/${user.id}/${crypto.randomUUID()}.${ext}`

  const admin = createServiceRoleSupabaseClient()
  const { data, error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: false,
  })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(data.path)
  return NextResponse.json({ success: true, url: urlData.publicUrl, path: data.path })
}

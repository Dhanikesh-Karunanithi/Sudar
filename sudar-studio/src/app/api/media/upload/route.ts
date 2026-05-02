import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'

const BUCKET = 'course-media'
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const MAX_SIZE_BYTES_AUDIO = 15 * 1024 * 1024 // 15MB for audio
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/mp4']
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_AUDIO_TYPES]

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file || !(file instanceof File)) return NextResponse.json({ error: 'file required' }, { status: 400 })

  if (file.size > MAX_SIZE_BYTES_AUDIO) {
    return NextResponse.json({ error: 'File too large. Max 15MB.' }, { status: 400 })
  }

  const clientType = file.type?.toLowerCase() || null
  const buffer = Buffer.from(await file.arrayBuffer())
  const { fileTypeFromBuffer } = await import('file-type')
  const detected = await fileTypeFromBuffer(buffer)
  const mime = detected?.mime?.toLowerCase() ?? null
  if (!mime || !ALLOWED_TYPES.includes(mime)) {
    return NextResponse.json(
      {
        error:
          'Invalid file content. Bytes must match an allowed image or audio format (magic-byte verified).',
      },
      { status: 400 }
    )
  }
  if (clientType && ALLOWED_TYPES.includes(clientType) && clientType !== mime) {
    return NextResponse.json(
      { error: 'Declared file type does not match actual file contents.' },
      { status: 400 }
    )
  }

  const type = mime
  const isAudio = ALLOWED_AUDIO_TYPES.includes(type)
  const maxSize = isAudio ? MAX_SIZE_BYTES_AUDIO : MAX_SIZE_BYTES
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: isAudio ? 'File too large. Max 15MB.' : 'File too large. Max 5MB.' },
      { status: 400 }
    )
  }

  const orgId = await getOrCreateOrg(user.id)
  const courseId = (formData.get('course_id') as string)?.trim() || 'shared'
  const extMap: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/x-m4a': 'm4a',
    'audio/mp4': 'm4a',
  }
  const ext = extMap[type] || type.split('/')[1] || 'jpg'
  const name = `${crypto.randomUUID()}.${ext}`
  const path = `${orgId}/${courseId}/${name}`

  const admin = createServiceRoleSupabaseClient()

  const { data, error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: type,
    upsert: false,
  })

  if (error) {
    if (error.message?.includes('Bucket not found') || error.message?.includes('bucket')) {
      return NextResponse.json(
        { error: 'Storage bucket "course-media" is not configured. Create a public bucket in Supabase Dashboard.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(data.path)
  const url = urlData.publicUrl

  return NextResponse.json({ url, path: data.path })
}

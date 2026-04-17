import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Lists all file paths under a prefix in a Supabase Storage bucket (recursive).
 */
export async function listStorageFilesRecursive(
  admin: SupabaseClient,
  bucket: string,
  prefix: string
): Promise<string[]> {
  const out: string[] = []
  const queue: string[] = [prefix.replace(/\/+$/, '')]

  while (queue.length > 0) {
    const dir = queue.pop()!
    const { data, error } = await admin.storage.from(bucket).list(dir === '' ? undefined : dir, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error || !data) continue

    for (const item of data) {
      if (item.name.startsWith('.')) continue
      const path = dir ? `${dir}/${item.name}` : item.name
      if (item.metadata === null || item.metadata === undefined) {
        queue.push(path)
      } else {
        out.push(path)
      }
    }
  }

  return out
}

import type { SupabaseClient } from '@supabase/supabase-js'

export type ContentGenerationJobRow = {
  id: string
  org_id: string
  creator_user_id: string
  job_type: string
  status: string
  progress: number
  request_payload: Record<string, unknown>
  result_payload: Record<string, unknown> | null
  error_message: string | null
  webhook_url: string | null
  created_at: string
  updated_at: string
}

/** Typed access until `content_generation_jobs` is in generated Database types. */
export function contentGenerationJobsTable(admin: SupabaseClient) {
  return admin.from('content_generation_jobs') as unknown as {
    insert: (
      row: Record<string, unknown>,
    ) => {
      select: (cols: string) => {
        single: () => Promise<{ data: ContentGenerationJobRow | null; error: { message: string } | null }>
      }
    }
    update: (row: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> }
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{ data: ContentGenerationJobRow | null; error: { message: string } | null }>
      }
    }
  }
}

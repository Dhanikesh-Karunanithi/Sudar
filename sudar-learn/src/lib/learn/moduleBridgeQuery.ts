import { z } from 'zod'

/** Query params for GET `/api/learn/module-bridge` (validated before DB access). */
export const moduleBridgeQuerySchema = z.object({
  course_id: z.string().uuid(),
  module_id: z.string().uuid(),
})

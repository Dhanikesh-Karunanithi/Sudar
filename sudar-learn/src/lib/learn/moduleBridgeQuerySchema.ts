import { z } from 'zod'

export const moduleBridgeQuerySchema = z.object({
  course_id: z.string().uuid(),
  module_id: z.string().uuid(),
})

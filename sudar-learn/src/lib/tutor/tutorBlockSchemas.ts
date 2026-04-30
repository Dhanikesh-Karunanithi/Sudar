import { z } from 'zod'

/** Server-validated course/path navigation actions embedded in tutor responses. */
export const tutorActionSchema = z.object({
  type: z.enum(['open_course', 'open_path']),
  label: z.string().trim().min(1).max(80),
  href: z.string().trim().min(1).max(512),
  course_id: z.string().uuid().optional(),
  path_id: z.string().uuid().optional(),
})

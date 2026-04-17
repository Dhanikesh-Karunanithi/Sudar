import { z } from 'zod'

export const curriculumEntrySchema = z
  .object({
    title: z.string(),
    bloomLevel: z.string(),
    pedagogicalRole: z.string(),
    sectionStructure: z.array(z.string()).min(1),
    brief: z.string(),
    buildOn: z.string(),
    archetype: z.string().optional(),
  })
  .passthrough()

export const curriculumPlanSchema = z.array(curriculumEntrySchema).min(1)

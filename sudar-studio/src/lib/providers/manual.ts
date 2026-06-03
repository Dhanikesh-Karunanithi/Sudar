import type { ExternalCourseMetadata, ManualImportInput } from './types'

export function manualCourseMetadata(input: ManualImportInput): ExternalCourseMetadata {
  const providerCourseId =
    input.externalUrl.replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 120) || `manual-${Date.now()}`

  return {
    provider: 'manual',
    providerCourseId,
    title: input.title.trim(),
    description: input.description?.trim() ?? null,
    instructor: input.instructor?.trim() ?? null,
    externalUrl: input.externalUrl.trim(),
    embedUrl: input.embedUrl?.trim() ?? null,
    difficulty: input.difficulty ?? 'intermediate',
    estimatedDurationMins: input.estimatedDurationMins ?? null,
    sections: (input.sections ?? []).map((s) => ({ title: s.title })),
    topics: input.topics ?? [],
    requiresSignIn: input.requiresSignIn ?? false,
    signInInstructions: input.signInInstructions ?? null,
  }
}

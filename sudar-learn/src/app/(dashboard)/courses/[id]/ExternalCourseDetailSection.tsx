'use client'

import { ExternalCourseLabel } from '@/components/courses/ExternalCourseLabel'
import { ExternalCourseEmbed } from '@/components/courses/ExternalCourseEmbed'

export function ExternalCourseDetailSection({
  title,
  externalProvider,
  externalUrl,
  embedUrl,
}: {
  title: string
  externalProvider: string | null
  externalUrl: string | null
  embedUrl: string | null
}) {
  return (
    <div className="space-y-4">
      <ExternalCourseLabel provider={externalProvider} variant="banner" />
      <ExternalCourseEmbed
        title={title}
        externalProvider={externalProvider}
        externalUrl={externalUrl}
        embedUrl={embedUrl}
        minHeight="min-h-[min(50vh,480px)]"
      />
      <p className="text-xs text-muted-foreground px-1">
        Enroll below to save this open course to your library and track completion in Sudar.
      </p>
    </div>
  )
}

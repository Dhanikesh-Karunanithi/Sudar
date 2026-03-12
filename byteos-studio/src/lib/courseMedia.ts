/**
 * ByteOS Studio — Aggregate all media used in a course for the Project Media peek.
 */

import type { ModuleContent } from '@/types/content'
import { isRichContent } from '@/types/content'
import type { VideoScene, DialogueSegment } from '@/types/content'

export interface CourseMediaImage {
  url: string
  alt?: string
  attribution?: string
  moduleTitle: string
  moduleId: string
}

export interface CourseMedia {
  images: CourseMediaImage[]
  videoScenes: VideoScene[]
  podcastSegments: DialogueSegment[]
}

export interface CourseForMedia {
  modules: { id: string; title: string; content: ModuleContent }[]
  settings?: {
    video_scenes?: VideoScene[]
    podcast_dialogue?: DialogueSegment[]
  } | null
}

/**
 * Collect all images, video scenes, and podcast segments used in the course.
 * No API call — derives from the course object only.
 */
export function getCourseMedia(course: CourseForMedia): CourseMedia {
  const images: CourseMediaImage[] = []
  for (const mod of course.modules ?? []) {
    const content = mod.content
    if (!content) continue
    if (isRichContent(content)) {
      for (const section of content.sections ?? []) {
        if (section.image?.url) {
          images.push({
            url: section.image.url,
            alt: section.image.alt,
            attribution: section.image.attribution,
            moduleTitle: mod.title,
            moduleId: mod.id,
          })
        }
      }
    }
  }
  const videoScenes = (course.settings?.video_scenes ?? []) as VideoScene[]
  const podcastSegments = (course.settings?.podcast_dialogue ?? []) as DialogueSegment[]
  return { images, videoScenes, podcastSegments }
}

import type { MascotEventType, MascotId } from '@/types/mascot'

interface TrackMascotEventInput {
  eventType: MascotEventType
  mascotId: MascotId
  source: 'dashboard' | 'tutor_chat' | 'settings' | 'onboarding'
  detail?: Record<string, unknown>
}

export async function trackMascotEvent(input: TrackMascotEventInput): Promise<void> {
  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: input.eventType,
        modality: 'text',
        payload: {
          mascot_id: input.mascotId,
          source: input.source,
          ...input.detail,
        },
      }),
    })
  } catch {
    // Avoid blocking learner flows for telemetry failures.
  }
}

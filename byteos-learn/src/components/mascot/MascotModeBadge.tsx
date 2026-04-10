'use client'

import { MASCOT_PERSONAS } from '@/lib/mascot/personas'
import { MascotAvatar } from '@/components/mascot/MascotAvatar'
import type { MascotId } from '@/types/mascot'

export function MascotModeBadge({ mascotId }: { mascotId: MascotId }) {
  const persona = MASCOT_PERSONAS[mascotId]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 py-0.5 pl-0.5 pr-2 text-[11px] font-semibold text-muted-foreground">
      <MascotAvatar mascotId={mascotId} size="xs" className="rounded-full border-0 bg-transparent p-0" />
      {persona.name}
    </span>
  )
}

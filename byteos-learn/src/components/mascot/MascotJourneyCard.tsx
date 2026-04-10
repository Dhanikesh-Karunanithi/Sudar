'use client'

import { useEffect } from 'react'
import { buildMascotResponse, pickActiveMascot } from '@/lib/mascot/engine'
import { MASCOT_PERSONAS } from '@/lib/mascot/personas'
import { trackMascotEvent } from '@/lib/mascot/tracking'
import { MascotAvatar } from '@/components/mascot/MascotAvatar'
import type { MascotPreferences } from '@/types/mascot'

interface MascotJourneyCardProps {
  preferences: Partial<MascotPreferences> | null
  firstName: string
}

export function MascotJourneyCard({ preferences, firstName }: MascotJourneyCardProps) {
  const activeMascot = pickActiveMascot('dashboard_view', preferences)
  const response = buildMascotResponse('dashboard_view', preferences)
  const persona = MASCOT_PERSONAS[activeMascot]

  useEffect(() => {
    void trackMascotEvent({
      eventType: 'mascot_impression',
      mascotId: activeMascot,
      source: 'dashboard',
      detail: { trigger: 'dashboard_view' },
    })
  }, [activeMascot])

  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4 md:p-5">
      <div className="flex items-start gap-3">
        <MascotAvatar mascotId={activeMascot} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider font-semibold text-primary">Learning companion</p>
          <h3 className="text-sm font-semibold text-card-foreground mt-0.5">
            {persona.name} is with you, {firstName}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{response.text}</p>
        </div>
      </div>
    </section>
  )
}

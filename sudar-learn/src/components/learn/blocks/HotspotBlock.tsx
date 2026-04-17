'use client'

import { useState } from 'react'

interface Spot {
  x: number
  y: number
  label: string
  content: string
}

export function HotspotBlock({
  imageUrl,
  spots,
}: {
  imageUrl: string
  spots: Spot[]
}) {
  const [active, setActive] = useState<number | null>(null)

  if (!imageUrl || !spots?.length) return null
  return (
    <div className="my-6 rounded-xl border border-border bg-card overflow-hidden">
      <div className="relative">
        <img
          src={imageUrl}
          alt="Hotspot"
          className="w-full h-auto max-h-[400px] object-contain bg-muted/30"
        />
        {spots.map((spot, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(active === i ? null : i)}
            className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-10"
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
            }}
            title={spot.label}
          >
            {i + 1}
          </button>
        ))}
      </div>
      {active !== null && spots[active] && (
        <div className="p-4 border-t border-border bg-muted/30">
          <p className="text-sm font-medium text-card-foreground mb-1">
            {spots[active].label}
          </p>
          <p className="text-sm text-muted-foreground">{spots[active].content}</p>
        </div>
      )}
    </div>
  )
}

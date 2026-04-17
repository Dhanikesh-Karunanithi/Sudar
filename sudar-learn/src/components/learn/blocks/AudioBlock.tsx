'use client'

import { useState } from 'react'

export function AudioBlock({
  url,
  title,
  transcript,
}: {
  url: string
  title?: string
  transcript?: string
}) {
  const [showTranscript, setShowTranscript] = useState(false)

  if (!url) return null
  return (
    <div className="my-6 rounded-xl border border-border bg-card p-4">
      {title && (
        <p className="text-sm font-medium text-card-foreground mb-2">{title}</p>
      )}
      <audio controls src={url} className="w-full mt-2" />
      {transcript && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-xs font-medium text-primary hover:underline"
          >
            {showTranscript ? 'Hide transcript' : 'Show transcript'}
          </button>
          {showTranscript && (
            <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground leading-relaxed">
              {transcript}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

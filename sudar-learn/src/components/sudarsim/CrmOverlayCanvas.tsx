'use client'

import type { SimCrmSkin, SimPersonaState } from '@shared-sudarsim/schemas'

type Overlay = SimCrmSkin['overlays'][number]

export function CrmOverlayCanvas({
  skin,
  onAction,
}: {
  skin: SimCrmSkin
  onAction: (overlayId: string, action: string, value?: string) => void
}) {
  return (
    <div className="relative w-full overflow-auto rounded-lg border border-border bg-muted/30">
      <div
        className="relative mx-auto"
        style={{ width: '100%', maxWidth: skin.width, aspectRatio: `${skin.width} / ${skin.height}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={skin.image_url} alt="CRM workspace" className="h-full w-full object-contain" />
        {skin.overlays.map((overlay: Overlay) => (
          <CrmOverlayControl key={overlay.id} overlay={overlay} onAction={onAction} />
        ))}
      </div>
    </div>
  )
}

function CrmOverlayControl({
  overlay,
  onAction,
}: {
  overlay: Overlay
  onAction: (id: string, action: string, value?: string) => void
}) {
  const style = {
    left: `${overlay.x * 100}%`,
    top: `${overlay.y * 100}%`,
    width: `${overlay.w * 100}%`,
    height: `${overlay.h * 100}%`,
  }

  const config = overlay.config as { options?: string[]; placeholder?: string }

  if (overlay.type === 'readonly_field') {
    return (
      <div
        className="absolute overflow-hidden rounded border border-primary/40 bg-background/80 px-1 text-xs"
        style={style}
        aria-label={overlay.label}
      >
        {String(config.placeholder ?? overlay.label)}
      </div>
    )
  }

  if (overlay.type === 'dropdown') {
    return (
      <select
        className="absolute rounded border border-primary bg-background text-xs"
        style={style}
        aria-label={overlay.label}
        onChange={(e) => onAction(overlay.id, 'select', e.target.value)}
      >
        <option value="">{overlay.label}</option>
        {(config.options ?? []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  }

  if (overlay.type === 'textarea' || overlay.type === 'text_input') {
    return (
      <input
        type="text"
        className="absolute rounded border border-primary bg-background px-1 text-xs"
        style={style}
        placeholder={overlay.label}
        aria-label={overlay.label}
        onBlur={(e) => onAction(overlay.id, 'input', e.target.value)}
      />
    )
  }

  if (overlay.type === 'button') {
    return (
      <button
        type="button"
        className="absolute rounded bg-primary text-xs text-primary-foreground"
        style={style}
        aria-label={overlay.label}
        onClick={() => onAction(overlay.id, 'click')}
      >
        {overlay.label || 'Action'}
      </button>
    )
  }

  return (
    <button
      type="button"
      className="absolute rounded border border-dashed border-primary/60 bg-primary/10"
      style={style}
      aria-label={overlay.label}
      onClick={() => onAction(overlay.id, 'interact')}
    />
  )
}

export type { SimPersonaState }

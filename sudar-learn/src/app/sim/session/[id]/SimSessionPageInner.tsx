'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SimWorkspace } from '@/components/sudarsim/SimWorkspace'
import type { SimPersonaState } from '@shared-sudarsim/schemas'

export default function SimSessionPageInner({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [payload, setPayload] = useState<{
    scenario: Parameters<typeof SimWorkspace>[0]['scenario']
    persona_state: SimPersonaState
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void params.then(async ({ id }) => {
      if (id === 'new') {
        const scenarioId = searchParams.get('scenario_id')
        const moduleId = searchParams.get('module_id') ?? undefined
        const courseId = searchParams.get('course_id') ?? undefined
        const preview = searchParams.get('preview') === '1'
        if (!scenarioId) {
          setError('scenario_id required')
          return
        }
        const res = await fetch('/api/sim/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario_id: scenarioId,
            module_id: moduleId,
            course_id: courseId,
            preview,
          }),
        })
        const data = await res.json()
        if (!data.success) {
          setError(data.error ?? 'Failed to start session')
          return
        }
        const previewQuery = preview ? '&preview=1' : ''
        router.replace(
          `/sim/session/${data.session_id}?module_id=${moduleId ?? ''}&course_id=${courseId ?? ''}${previewQuery}`,
        )
        return
      }
      setSessionId(id)
      const res = await fetch(`/api/sim/session/${id}`)
      const data = await res.json()
      if (!data.success) {
        setError(data.error ?? 'Session not found')
        return
      }
      const sessionMeta = data.session?.metadata as { preview?: boolean } | null
      setIsPreview(Boolean(sessionMeta?.preview))
      setPayload({
        scenario: data.scenario ?? {
          id: data.session.scenario_id,
          title: 'Simulation',
          locale: 'en',
          persona: {},
          channels: {},
          crm_skin: null,
        },
        persona_state: data.session.persona_state,
      })
    })
  }, [params, searchParams, router])

  if (error) {
    return <div className="p-8 text-destructive">{error}</div>
  }
  if (!sessionId || !payload) {
    return <div className="p-8 text-muted-foreground">Loading simulation…</div>
  }

  const moduleId = searchParams.get('module_id') ?? undefined
  const courseId = searchParams.get('course_id') ?? undefined
  const previewFromQuery = searchParams.get('preview') === '1'
  const previewMode = isPreview || previewFromQuery

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {previewMode ? (
        <div
          className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          <span className="font-semibold text-amber-50">Preview mode</span> — test run only. Publish the
          scenario in Studio before learners can access it.
        </div>
      ) : null}
      <h1 className="mb-4 text-2xl font-bold text-foreground">{payload.scenario.title}</h1>
      <SimWorkspace
        sessionId={sessionId}
        scenario={payload.scenario}
        initialPersonaState={payload.persona_state}
        moduleId={moduleId}
        courseId={courseId}
        onCompleteModule={() => router.push(courseId ? `/courses/${courseId}/learn` : '/')}
      />
    </div>
  )
}

import { Suspense } from 'react'
import SimSessionPageInner from './SimSessionPageInner'

export default function SimSessionPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading simulation…</div>}>
      <SimSessionPageInner params={params} />
    </Suspense>
  )
}

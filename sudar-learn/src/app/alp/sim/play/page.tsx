import { validateSimEmbedToken } from '@/lib/alp/simEmbedToken'
import Link from 'next/link'

export default async function AlpSimPlayPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; scenario_id?: string }>
}) {
  const { token, scenario_id: scenarioParam } = await searchParams
  const payload = validateSimEmbedToken(token ?? null)
  if (!payload || payload.mode !== 'play') {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-destructive">Invalid or expired SudarSim play token.</p>
      </div>
    )
  }

  const scenarioId = payload.scenario_id ?? scenarioParam
  if (!scenarioId) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">No scenario_id on embed token.</p>
      </div>
    )
  }

  const launchUrl = `/sim/session/new?scenario_id=${encodeURIComponent(scenarioId)}`

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-bold text-foreground">SudarSim practice</h1>
      <Link
        href={launchUrl}
        className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
      >
        Start simulation
      </Link>
    </div>
  )
}

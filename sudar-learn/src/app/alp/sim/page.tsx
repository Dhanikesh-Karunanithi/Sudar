import Link from 'next/link'
import { validateSimEmbedToken } from '@/lib/alp/simEmbedToken'

export default async function AlpSimAuthorPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const payload = validateSimEmbedToken(token ?? null)
  if (!payload || payload.mode !== 'author') {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-destructive">Invalid or expired SudarSim embed token.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-xl font-bold text-foreground">SudarSim — LMS author</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Configure scenarios in Sudar Studio, or attach published scenarios to modules.
      </p>
      <p className="mt-4 text-sm text-foreground">
        Org: {payload.org_id} · User: {payload.sub}
      </p>
      <Link href="/" className="mt-6 inline-block text-sm text-primary underline">
        Open Sudar Learn
      </Link>
    </div>
  )
}

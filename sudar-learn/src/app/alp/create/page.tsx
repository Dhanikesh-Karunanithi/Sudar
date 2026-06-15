import { validateCreateEmbedToken } from '@/lib/alp/createAuth'
import { AlpCreateShell } from './AlpCreateShell'

export default async function AlpCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; tool?: string }>
}) {
  const { token, tool } = await searchParams
  const payload = token ? validateCreateEmbedToken(token) : null

  if (!payload) {
    return (
      <div className="min-h-[280px] flex items-center justify-center bg-slate-950 text-slate-400 p-4">
        <p className="text-sm">Invalid or expired Sudar Create link. Request a new embed token from your LMS admin.</p>
      </div>
    )
  }

  return <AlpCreateShell token={token!} creatorUserId={payload.sub} initialTool={tool ?? payload.tool} />
}

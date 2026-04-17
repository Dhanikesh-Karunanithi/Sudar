import { validateEmbedToken } from '@/lib/alp-auth'
import { AlpEmbedChat } from './AlpEmbedChat'

export default async function AlpEmbedPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const payload = token ? validateEmbedToken(token) : null

  if (!payload) {
    return (
      <div className="min-h-[280px] flex items-center justify-center bg-slate-900 text-slate-400 p-4">
        <p className="text-sm">Invalid or expired embed link. Please request a new link from your instructor.</p>
      </div>
    )
  }

  return (
    <div className="min-h-[280px] flex flex-col bg-slate-900">
      <AlpEmbedChat token={token!} userId={payload.sub} courseId={payload.course_id ?? undefined} moduleId={payload.module_id ?? undefined} />
    </div>
  )
}

import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getModuleBodyText } from '@/lib/contentBlocks'
import type { ModuleContent } from '@/types/content'
import { studioCourseEditorUrl, studioPublicOrigin } from '@/lib/urls/studioOrigin'
import { fillOneEmptyModule } from '@/lib/ai/courseGeneration/fillOneModule'
import { runInWaitUntil } from '@/lib/ai/courseGeneration/scheduleBackgroundFill'
import type { ModuleRow } from '@/lib/export/buildScorm12ExportZip'
import { ShareAutoRefresh } from './ShareAutoRefresh'

type ShareCourse = {
  id: string
  title: string
  created_by: string
  modules: ModuleRow[] | null
}

export default async function CoursePackagePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createServiceRoleSupabaseClient()
  const { data } = await admin
    .from('courses')
    .select('id, title, created_by, modules(title, order_index, content)')
    .filter('settings->>mcp_package_token', 'eq', token)
    .order('order_index', { referencedTable: 'modules', ascending: true })
    .maybeSingle()

  if (!data) {
    return (
      <main className="min-h-screen bg-background text-foreground px-4 py-16">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="font-heading text-2xl font-semibold">Package not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This learner package link is invalid or has expired.
          </p>
        </div>
      </main>
    )
  }

  const course = data as unknown as ShareCourse
  const modules = course.modules ?? []
  const remaining = modules.filter(
    (mod) => !getModuleBodyText(mod.content as ModuleContent | null)?.trim()
  ).length
  const ready = modules.length > 0 && remaining === 0
  const origin = studioPublicOrigin()
  const htmlUrl = `${origin}/api/share/packages/${token}?format=html`
  const scormUrl = `${origin}/api/share/packages/${token}?format=scorm-1.2`
  const studioUrl = studioCourseEditorUrl(course.id)

  if (!ready) {
    await runInWaitUntil(fillOneEmptyModule(course.id, course.created_by).then(() => undefined))
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {!ready ? <ShareAutoRefresh seconds={8} /> : null}
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-xs font-medium uppercase tracking-wide text-cyan-400">Sudar learner package</p>
        <h1 className="font-heading mt-2 text-3xl font-semibold">{course.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          HTML lessons and a SCORM 1.2 ZIP for any LMS. You do not need to open the Studio editor.
        </p>

        {!ready ? (
          <div
            className="mt-8 rounded-xl border border-border bg-card px-4 py-5"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm font-medium">Sudar is writing the lessons…</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {Math.max(0, modules.length - remaining)} of {modules.length} lessons ready. This page
              refreshes automatically.
            </p>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={htmlUrl}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Download HTML lessons
            </a>
            <a
              href={scormUrl}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium"
            >
              Download SCORM 1.2
            </a>
          </div>
        )}

        <ol className="mt-8 space-y-2">
          {modules.map((mod, i) => {
            const filled = Boolean(getModuleBodyText(mod.content as ModuleContent | null)?.trim())
            return (
              <li
                key={`${mod.order_index}-${mod.title}`}
                className="rounded-lg border border-border bg-card px-4 py-3 text-sm"
              >
                <span className="font-medium">
                  {i + 1}. {mod.title}
                </span>
                <span className="ml-2 text-muted-foreground">{filled ? 'Ready' : 'Writing…'}</span>
              </li>
            )
          })}
        </ol>

        <p className="mt-10 text-sm text-muted-foreground">
          Optional: host, publish, and keep editing in{' '}
          <a href={studioUrl} className="text-cyan-400 underline-offset-2 hover:underline">
            Sudar Studio
          </a>
          .
        </p>
      </div>
    </main>
  )
}

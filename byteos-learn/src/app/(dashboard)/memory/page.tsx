import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Bot, Lock, Pencil, Brain, BookOpen, AlertTriangle } from 'lucide-react'
import { MemoryEditor } from './MemoryEditor'
import { BentoCard } from '@/components/ui/BentoCard'
import { buildInsights } from '@/lib/memory/insights'
import { InsightsCarousel } from '@/components/memory/InsightsCarousel'

export default async function MemoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  const [
    { data: profile },
    { data: events },
    { data: enrollments },
    { data: interactions },
  ] = await Promise.all([
    admin
      .from('learner_profiles')
      .select('ai_tutor_context, learning_pace, difficulty_comfort, cognitive_style, next_best_action, modality_scores, streak_days')
      .eq('user_id', user!.id)
      .single(),
    admin
      .from('learning_events')
      .select('event_type, created_at, duration_secs, course_id, payload')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(100),
    admin
      .from('enrollments')
      .select('course_id, path_id, status, progress_pct, personalized_sequence')
      .eq('user_id', user!.id),
    admin
      .from('ai_interactions')
      .select('course_id')
      .eq('user_id', user!.id),
  ])

  const courseIds = new Set<string>()
  for (const e of enrollments ?? []) {
    if (e.course_id) courseIds.add(e.course_id)
  }
  for (const i of interactions ?? []) {
    if (i.course_id) courseIds.add(i.course_id)
  }
  let courseTitles: Record<string, string> = {}
  if (courseIds.size > 0) {
    const { data: courses } = await admin
      .from('courses')
      .select('id, title')
      .in('id', [...courseIds])
    courseTitles = Object.fromEntries((courses ?? []).map((c) => [c.id, c.title]))
  }

  const insights = buildInsights(
    profile ?? null,
    events ?? [],
    enrollments ?? [],
    interactions ?? [],
    { courseTitles }
  )

  const memory = (profile?.ai_tutor_context as Record<string, unknown>) ?? {}
  const interactionCount = (memory.interaction_count as number) ?? 0
  const knownConcepts = (memory.known_concepts as string[]) ?? []
  const strugglesWith = (memory.struggles_with as string[]) ?? []
  const learningStyleNotes = (memory.learning_style_notes as string) || ''
  const observedEmpty = knownConcepts.length === 0 && strugglesWith.length === 0 && !learningStyleNotes.trim()
  const lastUpdated = memory.last_updated as string | undefined

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero block — Sudar's Memory: primary gradient to match platform UI */}
      <section className="hero-block min-h-[200px] flex flex-col justify-between p-8 md:p-10 border-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-hover to-primary rounded-5xl" aria-hidden />
        <div className="relative z-10 flex items-center justify-between gap-6 flex-wrap">
          <div className="max-w-xl">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-3">Sudar&apos;s Memory</h1>
            <p className="text-primary-foreground/90 text-lg">
              What Sudar knows about you — built from {interactionCount} interaction{interactionCount !== 1 ? 's' : ''}. Your learning style and context help personalize every conversation.
            </p>
          </div>
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
            <Brain className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>
      </section>

      {/* Info banner */}
      <BentoCard padding="md" className="bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 flex items-start gap-3 rounded-5xl">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm space-y-1 text-amber-900 dark:text-amber-100">
          <p className="font-medium">How this memory works</p>
          <p className="text-xs leading-relaxed opacity-95">
            Sudar automatically builds a model of you from your questions and interactions.
            You can add context that helps Sudar help you better — like your background or learning goals.
            AI-observed data (concepts Sudar thinks you understood) is shown separately and cannot be manually inflated.
          </p>
        </div>
      </BentoCard>

      {/* Insights from your learning — full-width so 3D carousel has room */}
      {insights.length > 0 && (
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-background/80 py-4">
          <div className="max-w-2xl mx-auto px-4 space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-card-foreground">Insights from your learning</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              These cards update as you learn. Sudar uses this picture to personalize your experience.
            </p>
          </div>
          <InsightsCarousel insights={insights} />
        </div>
      )}

      {/* AI-observed — read-only */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-card-foreground">Observed by Sudar</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-pill">AI-written · read-only</span>
        </div>

        <BentoCard padding="none" className="divide-y divide-border overflow-hidden rounded-5xl kpi-card !p-0">
          {observedEmpty ? (
            <div className="px-5 py-6 space-y-1">
              <p className="text-sm text-muted-foreground">
                Sudar is still learning from your activity. Keep asking questions and taking quizzes to build this section.
              </p>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground/80">
                  Last updated: {new Date(lastUpdated).toLocaleDateString(undefined, { dateStyle: 'short' })}
                </p>
              )}
            </div>
          ) : (
            <>
              <MemorySection
                icon={<Brain className="w-4 h-4 text-green-500" />}
                title="Concepts you've engaged with"
                items={knownConcepts}
                empty="None recorded yet — keep learning!"
                pill="bg-green-100 text-green-700"
              />
              <MemorySection
                icon={<AlertTriangle className="w-4 h-4 text-orange-500" />}
                title="Areas where you've shown uncertainty"
                items={strugglesWith}
                empty="No struggles detected — great progress!"
                pill="bg-orange-100 text-orange-700"
              />
              <div className="px-5 py-4 space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-card-foreground">Learning style notes</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {learningStyleNotes || <span className="text-muted-foreground italic">Not yet observed</span>}
                </p>
              </div>
            </>
          )}
        </BentoCard>
      </div>

      {/* User-editable */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Pencil className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-card-foreground">Your context</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-pill">You control this</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Help Sudar understand your background and goals. This gets injected into every conversation.
        </p>
        <MemoryEditor
          userId={user!.id}
          initialBackground={(memory.self_reported_background as string) ?? ''}
          initialGoals={(memory.learning_goals as string) ?? ''}
          initialPreference={(memory.preferred_explanation_style as string) ?? ''}
        />
      </div>
    </div>
  )
}

function MemorySection({ icon, title, items, empty, pill }: {
  icon: React.ReactNode
  title: string
  items: string[]
  empty: string
  pill: string
}) {
  return (
    <div className="px-5 py-4 space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-card-foreground">{title}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-xs italic">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span key={item} className={`text-xs px-2.5 py-1 rounded-full font-medium ${pill}`}>
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

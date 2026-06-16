'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Users, BookOpen, Shield, ChevronRight, CheckCircle2 } from 'lucide-react'
import { SudarLogoMark } from '@/components/branding/SudarLogo'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 'workspace', icon: Building2, label: 'Workspace' },
  { id: 'team', icon: Users, label: 'Team' },
  { id: 'course', icon: BookOpen, label: 'First course' },
  { id: 'governance', icon: Shield, label: 'Governance' },
] as const

const COURSE_TYPES = [
  { value: 'blank', label: 'Blank course', desc: 'Start from scratch in the block editor' },
  { value: 'ai', label: 'AI-generated', desc: 'Upload a document or describe a topic' },
  { value: 'scorm', label: 'SCORM import', desc: 'Bring existing packaged e-learning' },
  { value: 'template', label: 'From template', desc: 'Pick a visual persona and outline' },
] as const

type CourseType = (typeof COURSE_TYPES)[number]['value']

interface Props {
  defaultWorkspaceName: string
}

export function StudioOnboardingFlow({ defaultWorkspaceName }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [workspaceName, setWorkspaceName] = useState(defaultWorkspaceName)
  const [inviteInput, setInviteInput] = useState('')
  const [inviteRole, setInviteRole] = useState<'CREATOR' | 'MANAGER' | 'ADMIN' | 'LEARNER'>('CREATOR')
  const [firstCourseType, setFirstCourseType] = useState<CourseType>('ai')
  const [requireContentApproval, setRequireContentApproval] = useState(false)
  const [requireLearnerConsent, setRequireLearnerConsent] = useState(false)

  const inviteEmails = inviteInput
    .split(/[\n,;]+/)
    .map((e) => e.trim())
    .filter(Boolean)

  async function finish() {
    setSaving(true)
    const res = await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceName,
        inviteEmails,
        inviteRole,
        firstCourseType,
        requireContentApproval,
        requireLearnerConsent,
      }),
    })
    const json = (await res.json()) as { success?: boolean; data?: { firstCoursePath?: string } }
    if (json.success && json.data?.firstCoursePath) {
      router.push(json.data.firstCoursePath)
      router.refresh()
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-3 mb-8">
          <SudarLogoMark className="h-9 w-auto text-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">Sudar Studio</p>
            <p className="text-xs text-muted-foreground">Set up your workspace</p>
          </div>
        </div>

        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                'flex-1 h-1 rounded-full transition-colors',
                i <= step ? 'bg-indigo-500' : 'bg-muted'
              )}
              aria-hidden
            />
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
          {step === 0 && (
            <>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Name your workspace</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  This is your organisation in Sudar—learners and courses belong here.
                </p>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-foreground">Workspace name</span>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="Acme L&D"
                />
              </label>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Invite your team</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Optional. Invites apply when colleagues sign up with that email. Skip if you are solo for now.
                </p>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-foreground">Email addresses</span>
                <textarea
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="colleague@company.com, designer@company.com"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-foreground">Default role for invites</span>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
                >
                  <option value="CREATOR">Creator — build and edit courses</option>
                  <option value="MANAGER">Manager — users, paths, analytics</option>
                  <option value="ADMIN">Admin — full org settings</option>
                  <option value="LEARNER">Learner — preview only in Studio</option>
                </select>
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Choose your first course</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  We will take you there when you finish. You can change approach anytime.
                </p>
              </div>
              <div className="space-y-2">
                {COURSE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setFirstCourseType(t.value)}
                    className={cn(
                      'w-full text-left rounded-xl border p-4 transition-colors',
                      firstCourseType === t.value
                        ? 'border-indigo-500/50 bg-indigo-500/10'
                        : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <p className="text-sm font-medium text-foreground">{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Org security defaults</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tune these now or later under Settings and Governance.
                </p>
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireContentApproval}
                  onChange={(e) => setRequireContentApproval(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  <span className="text-sm font-medium text-foreground">Require content approval before publish</span>
                  <span className="block text-xs text-muted-foreground mt-1">
                    Draft courses need manager sign-off before learners see them.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireLearnerConsent}
                  onChange={(e) => setRequireLearnerConsent(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  <span className="text-sm font-medium text-foreground">Require learner consent for AI personalization</span>
                  <span className="block text-xs text-muted-foreground mt-1">
                    Learners must opt in before generative overlays or tutor memory updates apply.
                  </span>
                </span>
              </label>
              <p className="text-xs text-muted-foreground">
                Full trust documentation:{' '}
                <Link href="/governance" className="text-indigo-400 hover:underline">
                  Governance page
                </Link>
              </p>
            </>
          )}

          <div className="flex items-center justify-between pt-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Back
              </button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                disabled={step === 0 && workspaceName.trim().length < 2}
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => void finish()}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Finish setup'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

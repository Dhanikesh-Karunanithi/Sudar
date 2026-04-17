'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Trophy, Users, Target, Gift, Crown,
  Plus, CheckCircle2, Clock, Loader2, ChevronRight,
  BarChart3, Flame
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

interface HealthData {
  healthScore: number
  grade: string
  memberCount: number
  activeThisWeek: number
  avgCompletionRate: number
  avgQuizScore: number
  weeklyActiveRatio: number
  certComplianceRatio: number
  topLearners: Array<{
    rank: number
    userId: string
    name: string | null
    xp: number
    level: number
    title: string
    engagement: number
  }>
  challengeCount: number
}

interface Challenge {
  id: string
  title: string
  description: string | null
  challenge_type: string
  coin_prize: number
  start_at: string
  end_at: string
  participantCount: number
  completedCount: number
  target_config: Record<string, unknown>
  teamProgress?: number
}

const CHALLENGE_TYPE_LABELS: Record<string, string> = {
  individual_completions:  'Most completions',
  team_total_completions:  'Team completions goal',
  compliance_deadline:     'Compliance deadline',
  streak_leaders:          'Streak leaders',
  quiz_score_avg:          'Highest quiz average',
}

const GRADE_COLORS: Record<string, string> = {
  A: 'text-success', B: 'text-primary', C: 'text-warning', D: 'text-destructive', F: 'text-destructive',
}

// ─── Academy Health Score Card ───────────────────────────────────────────────

function HealthScoreCard({ data }: { data: HealthData }) {
  return (
    <div className="rounded-card-lg border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-base font-bold text-card-foreground">Academy Health Score</h2>
          <p className="text-xs text-muted-foreground">Composite org learning health metric</p>
        </div>
        <div className="ml-auto text-right">
          <p className={cn('text-4xl font-bold tabular-nums', GRADE_COLORS[data.grade])}>
            {data.grade}
          </p>
          <p className="text-sm text-muted-foreground tabular-nums">{data.healthScore}/100</p>
        </div>
      </div>

      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-700',
            data.healthScore >= 80 ? 'bg-success' : data.healthScore >= 60 ? 'bg-warning' : 'bg-destructive'
          )}
          style={{ width: `${data.healthScore}%` }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active this week', value: `${data.weeklyActiveRatio}%`, icon: Flame, note: `${data.activeThisWeek}/${data.memberCount}` },
          { label: 'Avg completion', value: `${data.avgCompletionRate}%`, icon: CheckCircle2, note: 'Course avg' },
          { label: 'Quiz mastery', value: `${data.avgQuizScore}%`, icon: Target, note: 'Org average' },
          { label: 'Cert compliance', value: `${data.certComplianceRatio}%`, icon: Trophy, note: 'Paths done' },
        ].map(({ label, value, icon: Icon, note }) => (
          <div key={label} className="rounded-button border border-border p-3 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-card-foreground tabular-nums">{value}</p>
            <p className="text-[10px] text-muted-foreground">{note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Top Learners Table ──────────────────────────────────────────────────────

function TopLearnersTable({ learners }: { learners: HealthData['topLearners'] }) {
  return (
    <div className="rounded-card-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <Crown className="w-4 h-4 text-primary" />
        <h2 className="font-display text-base font-bold text-card-foreground">Top Explorers</h2>
      </div>
      <div className="divide-y divide-border">
        {learners.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No learner data yet.</p>
        )}
        {learners.map((l) => (
          <div key={l.userId} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors">
            <span className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
              l.rank === 1 ? 'bg-yellow-400/20 text-yellow-600' :
              l.rank === 2 ? 'bg-slate-400/20 text-slate-500' :
              l.rank === 3 ? 'bg-amber-600/20 text-amber-700' :
              'bg-muted text-muted-foreground'
            )}>
              {l.rank}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">{l.name ?? 'Learner'}</p>
              <p className="text-xs text-muted-foreground">{l.title} · Level {l.level}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-primary tabular-nums">{l.xp.toLocaleString()} XP</p>
              <p className="text-xs text-muted-foreground">{l.engagement}% engaged</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Create Challenge Form ───────────────────────────────────────────────────

function CreateChallengeForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('individual_completions')
  const [coinPrize, setCoinPrize] = useState(100)
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!title || !startAt || !endAt) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/org/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, challengeType: type,
          coinPrize, startAt: new Date(startAt).toISOString(), endAt: new Date(endAt).toISOString(),
        }),
      })
      const json = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || !json.success) { setError(json.error ?? 'Failed to create'); return }
      setTitle(''); setDescription(''); setCoinPrize(100)
      setOpen(false)
      onCreated()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-button text-sm font-semibold hover:opacity-90 transition-all"
      >
        <Plus className="w-4 h-4" /> New Challenge
      </button>
    )
  }

  return (
    <div className="rounded-card-lg border border-primary/30 bg-primary/5 p-5 space-y-4">
      <h3 className="font-display text-base font-bold text-card-foreground">Create Challenge</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. April Completion Sprint"
            className="w-full border border-border rounded-button px-3 py-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            placeholder="What is this challenge about?"
            className="w-full border border-border rounded-button px-3 py-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Challenge Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="w-full border border-border rounded-button px-3 py-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            {Object.entries(CHALLENGE_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Coin Prize</label>
          <input type="number" min={0} max={10000} value={coinPrize} onChange={(e) => setCoinPrize(Number(e.target.value))}
            className="w-full border border-border rounded-button px-3 py-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Start Date *</label>
          <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)}
            className="w-full border border-border rounded-button px-3 py-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">End Date *</label>
          <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)}
            className="w-full border border-border rounded-button px-3 py-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        <button onClick={handleCreate} disabled={!title || !startAt || !endAt || saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-button text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Create Challenge
        </button>
        <button onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:text-card-foreground">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Gift Coins Panel ────────────────────────────────────────────────────────

function GiftCoinsPanel({ members }: { members: Array<{ id: string; name: string | null }> }) {
  const [recipientId, setRecipientId] = useState('')
  const [amount, setAmount] = useState(50)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGift() {
    if (!recipientId || amount < 1) return
    setSending(true); setError(null)
    try {
      const res = await fetch('/api/org/coins/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientUserId: recipientId, amount, message: message || null }),
      })
      const json = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || !json.success) { setError(json.error ?? 'Gift failed'); return }
      setSent(true); setTimeout(() => setSent(false), 3000)
      setMessage('')
    } catch {
      setError('Network error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-card-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Gift className="w-4 h-4 text-primary" />
        <h2 className="font-display text-base font-bold text-card-foreground">Gift Coins</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Recipient</label>
          <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)}
            className="w-full border border-border rounded-button px-3 py-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            <option value="">Select a learner…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name ?? m.id.slice(0, 8)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Amount (SC)</label>
          <input type="number" min={1} max={5000} value={amount} onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full border border-border rounded-button px-3 py-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Message (optional)</label>
          <input value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Great work on this week's sprint!"
            className="w-full border border-border rounded-button px-3 py-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <button onClick={handleGift} disabled={!recipientId || amount < 1 || sending}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-button text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> :
          sent ? <CheckCircle2 className="w-4 h-4" /> :
          <><span className="text-base">⬡</span> Send {amount} SC</>
        }
      </button>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function GamificationToolsPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [members, setMembers] = useState<Array<{ id: string; name: string | null }>>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    try {
      const [hRes, cRes] = await Promise.all([
        fetch('/api/org/gamification'),
        fetch('/api/org/challenges'),
      ])
      const hJson = await hRes.json() as { data?: HealthData }
      const cJson = await cRes.json() as { data?: Challenge[] }
      setHealth(hJson.data ?? null)
      setChallenges(cJson.data ?? [])
      setMembers((hJson.data?.topLearners ?? []).map((l) => ({ id: l.userId, name: l.name })))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-48 bg-muted rounded-card-lg" />
        <div className="h-48 bg-muted rounded-card-lg" />
      </div>
    )
  }

  const activeChallenges = challenges.filter((c) => new Date(c.end_at) > new Date())
  const pastChallenges = challenges.filter((c) => new Date(c.end_at) <= new Date())

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-card-foreground">Gamification</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Motivate your org, track health, and reward learning.
        </p>
      </div>

      {health && <HealthScoreCard data={health} />}
      {health && <TopLearnersTable learners={health.topLearners} />}

      {/* Challenges */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="font-display text-base font-bold text-card-foreground">
              Challenges
              {activeChallenges.length > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">{activeChallenges.length} active</span>
              )}
            </h2>
          </div>
          <CreateChallengeForm onCreated={loadData} />
        </div>

        {activeChallenges.length === 0 && (
          <div className="rounded-card-lg border border-dashed border-border p-8 text-center">
            <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-card-foreground">No active challenges</p>
            <p className="text-xs text-muted-foreground mt-1">Create a challenge to motivate your org.</p>
          </div>
        )}

        <div className="space-y-3">
          {activeChallenges.map((ch) => {
            const progressPct = ch.participantCount > 0 ? Math.round((ch.completedCount / ch.participantCount) * 100) : 0
            const isLive = new Date(ch.start_at) <= new Date()
            const target = typeof ch.target_config?.target === 'number' ? ch.target_config.target : null

            return (
              <motion.div
                key={ch.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-card-lg border border-border bg-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-card-foreground">{ch.title}</p>
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                        isLive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                      )}>
                        {isLive ? 'Live' : 'Upcoming'}
                      </span>
                    </div>
                    {ch.description && <p className="text-xs text-muted-foreground mt-0.5">{ch.description}</p>}
                  </div>
                  {ch.coin_prize > 0 && (
                    <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 dark:text-yellow-400 shrink-0">
                      <span>⬡</span>{ch.coin_prize} SC
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {ch.participantCount} participants
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Ends {new Date(ch.end_at).toLocaleDateString()}
                  </span>
                  <span>{CHALLENGE_TYPE_LABELS[ch.challenge_type] ?? ch.challenge_type}</span>
                </div>
                {ch.participantCount > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{ch.completedCount}/{ch.participantCount} completed</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-[width] duration-700" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                )}
                {target !== null && (
                  <p className="text-xs text-muted-foreground">
                    Team progress: {(ch.teamProgress ?? 0).toLocaleString()} / {target.toLocaleString()}
                  </p>
                )}
              </motion.div>
            )
          })}
        </div>

        {pastChallenges.length > 0 && (
          <details className="group">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-card-foreground flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
              {pastChallenges.length} past challenges
            </summary>
            <div className="mt-2 space-y-2">
              {pastChallenges.map((ch) => (
                <div key={ch.id} className="flex items-center justify-between py-2 px-3 rounded-button border border-border/50 text-sm text-muted-foreground">
                  <span className="font-medium">{ch.title}</span>
                  <span className="text-xs">{ch.completedCount}/{ch.participantCount} done</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Gift coins */}
      <GiftCoinsPanel members={members} />
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Megaphone, Plus } from 'lucide-react'

interface Template {
  id: string
  slug: string
  category_slug: string
  title_mustache: string
  body_mustache: string | null
  cta_label: string | null
  cta_url_mustache: string | null
  channels: string[]
}

interface Campaign {
  id: string
  template_id: string
  status: string
  schedule_rule: Record<string, unknown>
  audience_filter: Record<string, unknown>
}

const CATEGORY_OPTIONS = [
  'course_assigned',
  'path_assigned',
  'mission_daily',
  'mission_streak_risk',
  'coin_drop',
  'achievement',
  'level_up',
  'leaderboard',
  'checkin_today',
  'tutor_proactive',
  'org_announcement',
  'creator_campaign',
]

export default function NotificationToolsPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('creator_campaign')
  const [titleTemplate, setTitleTemplate] = useState('New update for {{learner_name}}')
  const [bodyTemplate, setBodyTemplate] = useState('You have a new learning opportunity waiting in Sudar.')
  const [ctaLabel, setCtaLabel] = useState('Open now')
  const [ctaUrl, setCtaUrl] = useState('/learn/courses/{{course_id}}')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('{"target":"all"}')
  const [scheduleWhen, setScheduleWhen] = useState<'immediate' | 'iso' | 'cron'>('immediate')
  const [testing, setTesting] = useState(false)
  const [testMessage, setTestMessage] = useState<string | null>(null)

  async function load() {
    const [tRes, cRes] = await Promise.all([
      fetch('/api/org/notifications/templates'),
      fetch('/api/org/notifications/campaigns'),
    ])
    const tJson = await tRes.json()
    const cJson = await cRes.json()
    setTemplates(tJson.data ?? [])
    setCampaigns(cJson.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const ctaPresets = useMemo(
    () => [
      '/learn/courses/{{course_id}}',
      '/learn/paths/{{path_id}}',
      '/learn/coins',
      '/learn/leaderboard',
      '/learn/missions/{{mission_slug}}',
      '/learn/chat?prompt={{prompt}}',
    ],
    []
  )

  async function createTemplate() {
    await fetch('/api/org/notifications/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        category_slug: category,
        title_mustache: titleTemplate,
        body_mustache: bodyTemplate,
        cta_label: ctaLabel,
        cta_url_mustache: ctaUrl,
        channels: ['in_app', 'web_push', 'email'],
        branding: { accent_color: '#6d28d9', mascot_skin: 'sudar_default' },
      }),
    })
    setSlug('')
    await load()
  }

  async function createCampaign() {
    let parsedFilter: Record<string, unknown> = { target: 'all' }
    try {
      parsedFilter = JSON.parse(audienceFilter)
    } catch {}
    await fetch('/api/org/notifications/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: selectedTemplateId,
        audience_filter: parsedFilter,
        schedule_rule:
          scheduleWhen === 'immediate'
            ? { when: 'immediate', repeat: false }
            : scheduleWhen === 'iso'
              ? { when: new Date(Date.now() + 3600000).toISOString(), repeat: false }
              : { when: '0 9 * * 1', repeat: 'weekly' },
        status: 'scheduled',
      }),
    })
    await load()
  }

  async function testSendToMe() {
    if (!selectedTemplateId) return
    setTesting(true)
    setTestMessage(null)
    const response = await fetch('/api/org/notifications/campaigns/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_id: selectedTemplateId }),
    })
    const json = await response.json().catch(() => ({}))
    setTesting(false)
    if (!response.ok) {
      setTestMessage(typeof json.error === 'string' ? json.error : 'Test send failed')
      return
    }
    setTestMessage('Test notification sent to your account.')
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading notifications tools...</div>

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Megaphone className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">Templates, quicklinks, campaigns, and branded CTA nudges.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-card-foreground flex items-center gap-2"><Plus className="w-4 h-4" /> Template composer</h2>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug (e.g. mission_boost_weekly)" className="w-full rounded-lg border border-border px-3 py-2 bg-background text-sm" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 bg-background text-sm">
            {CATEGORY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <input value={titleTemplate} onChange={(e) => setTitleTemplate(e.target.value)} placeholder="Title template" className="w-full rounded-lg border border-border px-3 py-2 bg-background text-sm" />
          <textarea value={bodyTemplate} onChange={(e) => setBodyTemplate(e.target.value)} rows={3} placeholder="Body template" className="w-full rounded-lg border border-border px-3 py-2 bg-background text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="CTA label" className="w-full rounded-lg border border-border px-3 py-2 bg-background text-sm" />
            <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="CTA URL template" className="w-full rounded-lg border border-border px-3 py-2 bg-background text-sm" />
          </div>
          <div className="flex flex-wrap gap-2">
            {ctaPresets.map((preset) => (
              <button key={preset} onClick={() => setCtaUrl(preset)} className="px-2 py-1 text-xs rounded-full border border-border hover:bg-muted">
                {preset}
              </button>
            ))}
          </div>
          <button onClick={() => void createTemplate()} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
            Save template
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-card-foreground">Campaign scheduler</h2>
          <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 bg-background text-sm">
            <option value="">Select template</option>
            {templates.map((template) => <option key={template.id} value={template.id}>{template.slug} ({template.category_slug})</option>)}
          </select>
          <select value={scheduleWhen} onChange={(e) => setScheduleWhen(e.target.value as 'immediate' | 'iso' | 'cron')} className="w-full rounded-lg border border-border px-3 py-2 bg-background text-sm">
            <option value="immediate">Immediate</option>
            <option value="iso">In 1 hour (ISO)</option>
            <option value="cron">Weekly (cron)</option>
          </select>
          <textarea value={audienceFilter} onChange={(e) => setAudienceFilter(e.target.value)} rows={3} className="w-full rounded-lg border border-border px-3 py-2 bg-background text-sm font-mono" />
          <button disabled={!selectedTemplateId} onClick={() => void createCampaign()} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
            Schedule campaign
          </button>
          <button disabled={!selectedTemplateId || testing} onClick={() => void testSendToMe()} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold disabled:opacity-60">
            {testing ? 'Sending test...' : 'Send test to me'}
          </button>
          {testMessage && <p className="text-xs text-muted-foreground">{testMessage}</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-card-foreground">Saved templates</h2>
        <div className="space-y-2">
          {templates.length === 0 && <p className="text-sm text-muted-foreground">No templates yet.</p>}
          {templates.map((template) => (
            <div key={template.id} className="rounded-lg border border-border p-3">
              <p className="text-sm font-semibold text-card-foreground">{template.slug}</p>
              <p className="text-xs text-muted-foreground">{template.category_slug} · {template.channels.join(', ')}</p>
              <p className="text-xs mt-1 text-card-foreground">{template.title_mustache}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-card-foreground">Scheduled campaigns</h2>
        <div className="space-y-2">
          {campaigns.length === 0 && <p className="text-sm text-muted-foreground">No campaigns yet.</p>}
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-lg border border-border p-3">
              <p className="text-sm font-semibold text-card-foreground">{campaign.status}</p>
              <p className="text-xs text-muted-foreground">Template: {campaign.template_id}</p>
              <p className="text-xs text-muted-foreground">Schedule: {JSON.stringify(campaign.schedule_rule)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

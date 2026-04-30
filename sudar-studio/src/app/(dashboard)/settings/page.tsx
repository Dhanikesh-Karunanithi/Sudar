'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Settings,
  Building2,
  BarChart2,
  Plus,
  Trash2,
  Save,
  Sparkles,
  Shield,
  Server,
  BookOpen,
  Bot,
} from 'lucide-react'
import { SudarInlineLoader, SudarLoadingFrost } from '@/components/branding/SudarBrandLoader'
import type { PerformanceConfig, KpiDefinition, TermDefinition } from '@/types/performance'
import { ModelPicker, type ModelPickerOption } from '@/components/ui/ModelPicker'
import { ProfilePhotoSettingsCard } from '@/components/features/profile/ProfilePhotoSettingsCard'
import { VoiceCharacterStage } from '@/components/features/audio/VoiceCharacterStage'
import type { VoiceLibraryProviderStatus } from '@/lib/audio/voices'
import { normalizeTtsVoiceId, TTS_VOICE_OPTIONS } from '@/lib/audio/voices'

const CONTENT_GENERATION_MODEL_OPTIONS: ModelPickerOption[] = [
  { id: 'default', name: 'Default', description: 'Great for most course generation tasks' },
  { id: 'complex', name: 'Complex tasks', description: 'Better for long or detailed content' },
  { id: 'fast', name: 'Faster', description: 'Quicker responses for daily use' },
]

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [saved, setSaved] = useState(false)
  const [institutionType, setInstitutionType] = useState<PerformanceConfig['institution_type']>('other')
  const [kpis, setKpis] = useState<KpiDefinition[]>([])
  const [scale, setScale] = useState<'percentage' | 'letter' | 'gpa'>('percentage')
  const [terms, setTerms] = useState<TermDefinition[]>([])
  const [ttsVoice, setTtsVoice] = useState<string | null>('en-US-JennyNeural')
  const [contentGenerationModel, setContentGenerationModel] = useState<string | null>('default')
  const [allowGenerativePersonalization, setAllowGenerativePersonalization] = useState(true)
  const [requireLearnerConsent, setRequireLearnerConsent] = useState(false)
  const [personalizationRetentionDays, setPersonalizationRetentionDays] = useState<string>('')
  const [learningEventsRetentionDays, setLearningEventsRetentionDays] = useState<string>('')
  const [aiInteractionsRetentionDays, setAiInteractionsRetentionDays] = useState<string>('')
  const [blockHighRiskPiiInTutor, setBlockHighRiskPiiInTutor] = useState(true)
  const [tutorRedactEchoedSecrets, setTutorRedactEchoedSecrets] = useState(true)
  const [tutorOutputModerationStrict, setTutorOutputModerationStrict] = useState(false)
  const [usePrivateServer, setUsePrivateServer] = useState(false)
  const [privateServerUrl, setPrivateServerUrl] = useState('')
  const [privateServerModel, setPrivateServerModel] = useState('')
  const [privateAiFeatureAvailable, setPrivateAiFeatureAvailable] = useState(false)
  const [privateAiBearerConfigured, setPrivateAiBearerConfigured] = useState(false)
  const [privateAiTestStatus, setPrivateAiTestStatus] = useState<string | null>(null)
  const [privateAiTesting, setPrivateAiTesting] = useState(false)
  const [voiceProviderStatuses, setVoiceProviderStatuses] = useState<VoiceLibraryProviderStatus[]>([])
  const [agentsEnabled, setAgentsEnabled] = useState(true)
  const [agentsCohortPulse, setAgentsCohortPulse] = useState(true)
  const [agentsLearnerWeekPlan, setAgentsLearnerWeekPlan] = useState(true)
  const [agentsSpacingNudges, setAgentsSpacingNudges] = useState(true)
  const [agentsPolicyPackId, setAgentsPolicyPackId] = useState('default')
  const [agentsExplanationLevel, setAgentsExplanationLevel] = useState<'simple' | 'advanced'>('simple')
  const [showAgentsFieldDetails, setShowAgentsFieldDetails] = useState(false)

  const fetchSettings = useCallback(async () => {
    const res = await fetch('/api/org/settings')
    if (res.status === 403) {
      setForbidden(true)
      setLoading(false)
      return
    }
    if (!res.ok) {
      setLoading(false)
      return
    }
    const data = await res.json()
    setInstitutionType(data.institution_type ?? 'other')
    setKpis(Array.isArray(data.kpis) ? data.kpis : [])
    setScale(data.scale ?? 'percentage')
    setTerms(Array.isArray(data.terms) ? data.terms : [])
    if (data.ai_models) {
      setTtsVoice(normalizeTtsVoiceId(data.ai_models.tts_voice) ?? 'en-US-JennyNeural')
      setContentGenerationModel(data.ai_models.content_generation_model ?? 'default')
    }
    if (data.ai_compliance) {
      setAllowGenerativePersonalization(data.ai_compliance.allow_generative_personalization !== false)
      setRequireLearnerConsent(data.ai_compliance.require_learner_consent === true)
      const d = data.ai_compliance.personalization_data_retention_days
      setPersonalizationRetentionDays(typeof d === 'number' && !Number.isNaN(d) ? String(d) : '')
      const le = data.ai_compliance.learning_events_retention_days
      setLearningEventsRetentionDays(typeof le === 'number' && !Number.isNaN(le) ? String(le) : '')
      const ai = data.ai_compliance.ai_interactions_retention_days
      setAiInteractionsRetentionDays(typeof ai === 'number' && !Number.isNaN(ai) ? String(ai) : '')
      setBlockHighRiskPiiInTutor(data.ai_compliance.block_high_risk_pii_in_tutor !== false)
      setTutorRedactEchoedSecrets(data.ai_compliance.tutor_redact_echoed_secrets !== false)
      setTutorOutputModerationStrict(data.ai_compliance.tutor_output_moderation_strict === true)
    }
    if (data.sudar_agents) {
      const sa = data.sudar_agents as Record<string, unknown>
      setAgentsEnabled(sa.enabled !== false)
      const ft = sa.features as Record<string, unknown> | undefined
      if (ft) {
        setAgentsCohortPulse(ft.cohort_pulse !== false)
        setAgentsLearnerWeekPlan(ft.learner_week_plan !== false)
        setAgentsSpacingNudges(ft.spacing_nudges !== false)
      }
      if (typeof sa.policy_pack_id === 'string' && sa.policy_pack_id.trim()) {
        setAgentsPolicyPackId(sa.policy_pack_id.trim())
      }
      if (sa.admin_explanation_level === 'advanced' || sa.admin_explanation_level === 'simple') {
        setAgentsExplanationLevel(sa.admin_explanation_level)
      }
    }
    if (data.ai_inference) {
      setUsePrivateServer(data.ai_inference.use_private_server === true)
      setPrivateServerUrl(typeof data.ai_inference.private_server_url === 'string' ? data.ai_inference.private_server_url : '')
      setPrivateServerModel(typeof data.ai_inference.private_server_model === 'string' ? data.ai_inference.private_server_model : '')
      setPrivateAiFeatureAvailable(data.ai_inference.feature_available === true)
      setPrivateAiBearerConfigured(data.ai_inference.bearer_configured === true)
    }
    const keysRes = await fetch('/api/settings/keys-status')
    if (keysRes.ok) {
      const keysData = await keysRes.json()
      const keys = Array.isArray(keysData.keys) ? keysData.keys : []
      setVoiceProviderStatuses([
        {
          id: 'sarvam',
          name: 'Sarvam',
          status: keys.some((k: { envVar?: string; status?: string }) => k.envVar === 'SARVAM_API_KEY' && k.status === 'configured')
            ? 'configured'
            : 'not_set',
          description: 'Indian-language provider integration. Voice list will appear when provider libraries are enabled.',
        },
        {
          id: 'elevenlabs',
          name: 'ElevenLabs',
          status: keys.some((k: { envVar?: string; status?: string }) => k.envVar === 'ELEVENLABS_API_KEY' && k.status === 'configured')
            ? 'configured'
            : 'not_set',
          description: 'Premium narration voice provider. Library preview is planned in a follow-up.',
        },
        {
          id: 'openai',
          name: 'OpenAI',
          status: keys.some((k: { envVar?: string; status?: string }) => k.envVar === 'OPENAI_API_KEY' && k.status === 'configured')
            ? 'configured'
            : 'not_set',
          description: 'Cloud TTS/chat provider available for generation paths.',
        },
      ])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const performance_config: PerformanceConfig = {
      institution_type: institutionType,
      ...(institutionType === 'corporate' && { kpis }),
      ...(institutionType === 'educational' && { scale, terms }),
    }
    const res = await fetch('/api/org/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        performance_config,
        ai_models: {
          tts_voice: ttsVoice,
          content_generation_model: contentGenerationModel,
        },
        ai_compliance: {
          allow_generative_personalization: allowGenerativePersonalization,
          require_learner_consent: requireLearnerConsent,
          block_high_risk_pii_in_tutor: blockHighRiskPiiInTutor,
          tutor_redact_echoed_secrets: tutorRedactEchoedSecrets,
          tutor_output_moderation_strict: tutorOutputModerationStrict,
          ...(personalizationRetentionDays.trim() !== '' && {
            personalization_data_retention_days: Number(personalizationRetentionDays),
          }),
          ...(learningEventsRetentionDays.trim() !== '' && {
            learning_events_retention_days: Number(learningEventsRetentionDays),
          }),
          ...(aiInteractionsRetentionDays.trim() !== '' && {
            ai_interactions_retention_days: Number(aiInteractionsRetentionDays),
          }),
        },
        ...(privateAiFeatureAvailable && {
          ai_inference: {
            use_private_server: usePrivateServer,
            private_server_url: privateServerUrl,
            private_server_model: privateServerModel,
          },
        }),
        sudar_agents: {
          enabled: agentsEnabled,
          features: {
            cohort_pulse: agentsCohortPulse,
            learner_week_plan: agentsLearnerWeekPlan,
            spacing_nudges: agentsSpacingNudges,
          },
          policy_pack_id: agentsPolicyPackId.trim() || 'default',
          admin_explanation_level: agentsExplanationLevel,
        },
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  function addKpi() {
    setKpis((prev) => [
      ...prev,
      { id: `kpi-${Date.now()}`, name: '', unit: '', period: 'monthly' },
    ])
  }

  function removeKpi(id: string) {
    setKpis((prev) => prev.filter((k) => k.id !== id))
  }

  function updateKpi(id: string, field: keyof KpiDefinition, value: string | number) {
    setKpis((prev) =>
      prev.map((k) => (k.id === id ? { ...k, [field]: value } : k))
    )
  }

  function addTerm() {
    const now = new Date()
    const start = now.toISOString().slice(0, 10)
    const end = new Date(now.setMonth(now.getMonth() + 3)).toISOString().slice(0, 10)
    setTerms((prev) => [
      ...prev,
      { id: `term-${Date.now()}`, name: '', start, end },
    ])
  }

  function removeTerm(id: string) {
    setTerms((prev) => prev.filter((t) => t.id !== id))
  }

  function updateTerm(id: string, field: keyof TermDefinition, value: string) {
    setTerms((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    )
  }

  if (loading) {
    return (
      <div className="relative p-8 min-h-[min(50vh,420px)] overflow-hidden rounded-2xl">
        <SudarLoadingFrost label="Loading settings…" className="rounded-2xl" />
      </div>
    )
  }

  if (forbidden) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-center gap-3">
          <Settings className="w-6 h-6 text-amber-500 shrink-0" />
          <div>
            <p className="font-medium text-white">Access restricted</p>
            <p className="text-sm text-slate-400 mt-0.5">
              You need an Admin or Manager role to change organization settings.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <ProfilePhotoSettingsCard />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
            <Settings className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Org settings</h1>
            <p className="text-slate-400 text-sm">
              Institution type and performance configuration
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium"
        >
          {saving ? (
            <SudarInlineLoader size="sm" className="text-white" starFill="#4f46e5" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-white">Institution type</h2>
        </div>
        <p className="text-slate-500 text-sm">
          This drives how performance data (KPIs or grades) is configured for learners.
        </p>
        <select
          value={institutionType}
          onChange={(e) => setInstitutionType(e.target.value as PerformanceConfig['institution_type'])}
          className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="corporate">Corporate</option>
          <option value="educational">Educational</option>
          <option value="other">Other</option>
        </select>
      </div>

      {institutionType === 'corporate' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-slate-500" />
              <h2 className="font-semibold text-white">KPIs</h2>
            </div>
            <button
              type="button"
              onClick={addKpi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add KPI
            </button>
          </div>
          <p className="text-slate-500 text-sm">
            Define the performance metrics you track for learners (e.g. Sales target, NPS).
          </p>
          <div className="space-y-3">
            {kpis.map((k) => (
              <div
                key={k.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3"
              >
                <input
                  type="text"
                  placeholder="Name"
                  value={k.name}
                  onChange={(e) => updateKpi(k.id, 'name', e.target.value)}
                  className="flex-1 min-w-[120px] rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white placeholder-slate-500"
                />
                <input
                  type="text"
                  placeholder="Unit (e.g. %)"
                  value={k.unit ?? ''}
                  onChange={(e) => updateKpi(k.id, 'unit', e.target.value)}
                  className="w-20 rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white placeholder-slate-500"
                />
                <input
                  type="text"
                  placeholder="Period"
                  value={k.period ?? ''}
                  onChange={(e) => updateKpi(k.id, 'period', e.target.value)}
                  className="w-24 rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => removeKpi(k.id)}
                  className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {kpis.length === 0 && (
              <p className="text-slate-500 text-sm italic">No KPIs defined. Add one above.</p>
            )}
          </div>
        </div>
      )}

      {institutionType === 'educational' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-white">Grade scale</h2>
          </div>
          <select
            value={scale}
            onChange={(e) => setScale(e.target.value as 'percentage' | 'letter' | 'gpa')}
            className="rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="percentage">Percentage</option>
            <option value="letter">Letter (A–F)</option>
            <option value="gpa">GPA</option>
          </select>
          <div className="flex items-center justify-between pt-2">
            <h3 className="font-medium text-slate-300 text-sm">Terms / periods</h3>
            <button
              type="button"
              onClick={addTerm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add term
            </button>
          </div>
          <div className="space-y-3">
            {terms.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3"
              >
                <input
                  type="text"
                  placeholder="Term name"
                  value={t.name}
                  onChange={(e) => updateTerm(t.id, 'name', e.target.value)}
                  className="flex-1 min-w-[120px] rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white placeholder-slate-500"
                />
                <input
                  type="date"
                  value={t.start}
                  onChange={(e) => updateTerm(t.id, 'start', e.target.value)}
                  className="rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white"
                />
                <input
                  type="date"
                  value={t.end}
                  onChange={(e) => updateTerm(t.id, 'end', e.target.value)}
                  className="rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => removeTerm(t.id)}
                  className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {institutionType === 'other' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-slate-500 text-sm">
            Use “Other” for custom or flexible performance tracking. You can still add performance records with custom keys from the user detail page.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-white">AI personalization &amp; privacy</h2>
        </div>
        <p className="text-slate-500 text-sm">
          Controls optional generative features in Sudar Learn (course welcome and module helpers). Per-course audience is set on each course. Audit events are logged when learners use personalization.
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={allowGenerativePersonalization}
            onChange={(e) => setAllowGenerativePersonalization(e.target.checked)}
            className="rounded border-slate-600"
          />
          Allow generative personalization for this organization
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={requireLearnerConsent}
            onChange={(e) => setRequireLearnerConsent(e.target.checked)}
            className="rounded border-slate-600"
          />
          Require learners to accept before personalization runs
        </label>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Documented retention for AI-derived overlays (days, optional)</label>
          <input
            type="number"
            min={1}
            placeholder="e.g. 365 — enforcement can be added later"
            value={personalizationRetentionDays}
            onChange={(e) => setPersonalizationRetentionDays(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            Documented retention for learning events (days, optional)
          </label>
          <input
            type="number"
            min={1}
            placeholder="e.g. 365 — enforcement can be added later"
            value={learningEventsRetentionDays}
            onChange={(e) => setLearningEventsRetentionDays(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            Documented retention for AI tutor interactions (days, optional)
          </label>
          <input
            type="number"
            min={1}
            placeholder="e.g. 730 — enforcement can be added later"
            value={aiInteractionsRetentionDays}
            onChange={(e) => setAiInteractionsRetentionDays(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm"
          />
        </div>
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500/80" />
            <h3 className="font-medium text-white text-sm">Tutor and chat safety</h3>
          </div>
          <p className="text-slate-500 text-xs">
            Applies to Sudar Learn tutor, paste workflows, and Studio chat. Heuristic checks only — not a substitute for policy training.
          </p>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={blockHighRiskPiiInTutor}
              onChange={(e) => setBlockHighRiskPiiInTutor(e.target.checked)}
              className="rounded border-slate-600"
            />
            Block payment card, ID, and private-key patterns before they reach AI providers
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={tutorRedactEchoedSecrets}
              onChange={(e) => setTutorRedactEchoedSecrets(e.target.checked)}
              className="rounded border-slate-600"
            />
            Redact card-like number sequences from tutor replies
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={tutorOutputModerationStrict}
              onChange={(e) => setTutorOutputModerationStrict(e.target.checked)}
              className="rounded border-slate-600"
            />
            Strict output moderation (extra redaction on tutor and Studio agent replies)
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-400/90" />
          <h2 className="font-semibold text-white">Sudar Agents</h2>
        </div>
        <p className="text-slate-500 text-sm">
          Turn off orchestration for this organisation or trim individual capabilities. Learners only see automation your org allows; see{' '}
          <Link href="/agents" className="text-indigo-400 hover:text-indigo-300">
            Sudar Agents
          </Link>{' '}
          for recent runs.
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={agentsEnabled}
            onChange={(e) => setAgentsEnabled(e.target.checked)}
            className="rounded border-slate-600"
          />
          Enable Sudar Agents for this organisation
        </label>
        <p className="text-slate-500 text-xs">
          Default Studio agents view:{' '}
          <label className="inline-flex items-center gap-2 cursor-pointer text-slate-400">
            <input
              type="radio"
              name="agents_explain"
              checked={agentsExplanationLevel === 'simple'}
              onChange={() => setAgentsExplanationLevel('simple')}
              className="rounded border-slate-600"
            />
            Simple
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer text-slate-400 ml-3">
            <input
              type="radio"
              name="agents_explain"
              checked={agentsExplanationLevel === 'advanced'}
              onChange={() => setAgentsExplanationLevel('advanced')}
              className="rounded border-slate-600"
            />
            Advanced
          </label>
        </p>
        <button
          type="button"
          onClick={() => setShowAgentsFieldDetails((v) => !v)}
          className="text-xs text-indigo-400 hover:text-indigo-300"
        >
          {showAgentsFieldDetails ? 'Hide' : 'Show'} advanced fields
        </button>
        {showAgentsFieldDetails && (
          <div className="space-y-3 pl-1 border-l-2 border-slate-700 ml-1">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={agentsCohortPulse}
                onChange={(e) => setAgentsCohortPulse(e.target.checked)}
                disabled={!agentsEnabled}
                className="rounded border-slate-600 disabled:opacity-40"
              />
              Cohort pulse (path health) in Studio
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={agentsLearnerWeekPlan}
                onChange={(e) => setAgentsLearnerWeekPlan(e.target.checked)}
                disabled={!agentsEnabled}
                className="rounded border-slate-600 disabled:opacity-40"
              />
              Learner week-plan API / dashboard strip
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={agentsSpacingNudges}
                onChange={(e) => setAgentsSpacingNudges(e.target.checked)}
                disabled={!agentsEnabled}
                className="rounded border-slate-600 disabled:opacity-40"
              />
              Spacing-style notification cron
            </label>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Policy pack id</label>
              <input
                type="text"
                value={agentsPolicyPackId}
                onChange={(e) => setAgentsPolicyPackId(e.target.value)}
                disabled={!agentsEnabled}
                className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm disabled:opacity-40"
              />
              <p className="text-slate-500 text-xs mt-1">Forwarded to Intelligence when supported (default: default).</p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-white">Where Sudar runs your AI</h2>
        </div>
        <p className="text-slate-500 text-sm">
          By default, Sudar sends chat and generation requests to cloud AI services using the keys in{' '}
          <Link href="/settings/keys" className="text-indigo-400 hover:text-indigo-300">AI &amp; API Keys</Link>.
          Your organisation can instead use a private AI server on your network (for example Ollama with Gemma on a PC in your office).
        </p>
        <p className="text-slate-500 text-xs">
          New to these ideas? Take the short course:{' '}
          <Link href="/help/ai-at-sudar" className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Understanding AI in Sudar
          </Link>
        </p>
        {!privateAiFeatureAvailable && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200/90">
            Private organisation AI is not enabled on this deployment. Your platform operator sets{' '}
            <code className="text-xs bg-slate-800 px-1 rounded">ALLOW_ORG_PRIVATE_AI_SERVER=true</code> and supplies a server token (
            <code className="text-xs bg-slate-800 px-1 rounded">LOCAL_LLM_BEARER_TOKEN</code> or{' '}
            <code className="text-xs bg-slate-800 px-1 rounded">AI_CHAT_API_KEY</code>).
          </div>
        )}
        {privateAiFeatureAvailable && (
          <>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={usePrivateServer}
                onChange={(e) => setUsePrivateServer(e.target.checked)}
                className="rounded border-slate-600"
              />
              Use our organisation&apos;s private AI server for chat and generation
            </label>
            <div className="space-y-3 pl-1 border-l-2 border-slate-700 ml-1">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Server address</label>
                <input
                  type="url"
                  placeholder="http://192.168.1.10:11434"
                  value={privateServerUrl}
                  onChange={(e) => setPrivateServerUrl(e.target.value)}
                  disabled={!usePrivateServer}
                  className="w-full max-w-lg rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm disabled:opacity-50"
                />
                <p className="text-slate-500 text-xs mt-1">
                  Full URL including <code className="text-slate-400">http://</code> or <code className="text-slate-400">https://</code>.
                  Typical home/office: port <code className="text-slate-400">11434</code> (Ollama) or <code className="text-slate-400">1234</code> (LM Studio).
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Model name</label>
                <input
                  type="text"
                  placeholder="gemma3:4b"
                  value={privateServerModel}
                  onChange={(e) => setPrivateServerModel(e.target.value)}
                  disabled={!usePrivateServer}
                  className="w-full max-w-lg rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm disabled:opacity-50"
                />
                <p className="text-slate-500 text-xs mt-1">Must match the name shown in your AI app (exact spelling).</p>
              </div>
              <p className="text-slate-500 text-xs">
                <strong className="text-slate-400">Password for the server:</strong> not stored here. IT sets{' '}
                <code className="text-slate-400">LOCAL_LLM_BEARER_TOKEN</code> or{' '}
                <code className="text-slate-400">AI_CHAT_API_KEY</code> once on the Sudar server — same for all orgs on this deployment.
                {privateAiBearerConfigured ? (
                  <span className="text-emerald-400/90"> Currently configured on this server.</span>
                ) : (
                  <span className="text-amber-400/90"> Not set yet — private AI will not work until it is.</span>
                )}
              </p>
              <p className="text-slate-500 text-xs">
                Course search and embeddings may still use cloud keys unless you configure those separately.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={!usePrivateServer || privateAiTesting}
                  onClick={async () => {
                    setPrivateAiTesting(true)
                    setPrivateAiTestStatus(null)
                    const saveFirst = await fetch('/api/org/settings', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ai_inference: {
                          use_private_server: usePrivateServer,
                          private_server_url: privateServerUrl,
                          private_server_model: privateServerModel,
                        },
                      }),
                    })
                    if (!saveFirst.ok) {
                      const err = await saveFirst.json().catch(() => ({}))
                      setPrivateAiTestStatus(typeof err.error === 'string' ? err.error : 'Could not save settings.')
                      setPrivateAiTesting(false)
                      return
                    }
                    const tr = await fetch('/api/org/settings/test-private-ai', { method: 'POST' })
                    const td = await tr.json().catch(() => ({}))
                    if (td.ok) setPrivateAiTestStatus(`Success: ${td.sample_reply ? `"${td.sample_reply.slice(0, 80)}"` : 'connected'}`)
                    else setPrivateAiTestStatus(typeof td.error === 'string' ? td.error : 'Test failed.')
                    setPrivateAiTesting(false)
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-sm"
                >
                  {privateAiTesting ? <SudarInlineLoader size="sm" className="text-violet-400" starFill="var(--background)" /> : null}
                  Test connection
                </button>
                {privateAiTestStatus && (
                  <span className="text-xs text-slate-400 max-w-md">{privateAiTestStatus}</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-white">AI models</h2>
        </div>
        <p className="text-slate-500 text-sm">
          Default models for course generation and Listen (audio) modality. Learners can override TTS voice in Learn.
        </p>
        <p className="text-slate-500 text-xs">
          To configure API keys for AI providers (OpenRouter, Together, OpenAI, etc.), go to{' '}
          <Link href="/settings/keys" className="text-indigo-400 hover:text-indigo-300">AI &amp; API Keys</Link>.
        </p>
        <div className="space-y-6">
          <VoiceCharacterStage
            voices={TTS_VOICE_OPTIONS}
            value={ttsVoice}
            onChange={(id) => setTtsVoice(id)}
            providerStatuses={voiceProviderStatuses}
          />
          <ModelPicker
            title="Content generation"
            subtitle="Default model for AI course and content generation in Studio."
            options={CONTENT_GENERATION_MODEL_OPTIONS.map((o) => ({ ...o, icon: <Sparkles className="w-4 h-4" /> }))}
            value={contentGenerationModel}
            onChange={(id) => setContentGenerationModel(id)}
            className="text-white"
          />
        </div>
      </div>
    </div>
  )
}

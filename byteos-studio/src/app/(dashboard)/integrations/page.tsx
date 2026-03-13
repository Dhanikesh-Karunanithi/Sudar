'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plug, Key, Code, Copy, Check, ExternalLink, MessageSquare, LayoutDashboard, Plus, Trash2, Loader2, Building2, Users, Database, Shield, ListOrdered } from 'lucide-react'
import { IntegrationVisualGuide } from '@/components/integrations/IntegrationVisualGuide'

const LEARN_BASE_URL =
  typeof process.env.NEXT_PUBLIC_LEARN_APP_URL === 'string' && process.env.NEXT_PUBLIC_LEARN_APP_URL
    ? process.env.NEXT_PUBLIC_LEARN_APP_URL.replace(/\/$/, '')
    : ''

type ApiKeyRow = { id: string; name: string; key_prefix: string; created_at: string; last_used_at: string | null }

export default function IntegrationsPage() {
  const [copied, setCopied] = useState<string | null>(null)
  const [keys, setKeys] = useState<ApiKeyRow[]>([])
  const [keysLoading, setKeysLoading] = useState(true)
  const [createName, setCreateName] = useState('')
  const [creating, setCreating] = useState(false)
  const [rawKeyModal, setRawKeyModal] = useState<{ raw_key: string; name: string } | null>(null)
  const [embedUserId, setEmbedUserId] = useState('')
  const [embedCourseId, setEmbedCourseId] = useState('')
  const [embedModuleId, setEmbedModuleId] = useState('')
  const [embedKey, setEmbedKey] = useState('')
  const [embedUrl, setEmbedUrl] = useState('')
  const [embedLoading, setEmbedLoading] = useState(false)
  const [embedError, setEmbedError] = useState<string | null>(null)

  const fetchKeys = useCallback(async () => {
    const res = await fetch('/api/integrations/keys')
    if (res.ok) {
      const data = await res.json()
      setKeys(data.keys ?? [])
    }
    setKeysLoading(false)
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  async function createKey() {
    const name = createName.trim() || 'ALP key'
    setCreating(true)
    try {
      const res = await fetch('/api/integrations/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (res.ok && data.raw_key) {
        setRawKeyModal({ raw_key: data.raw_key, name: data.key?.name ?? name })
        setCreateName('')
        fetchKeys()
      }
    } finally {
      setCreating(false)
    }
  }

  async function revokeKey(id: string) {
    if (!confirm('Revoke this key? It will stop working immediately.')) return
    await fetch(`/api/integrations/keys/${id}`, { method: 'DELETE' })
    fetchKeys()
  }

  async function getEmbedUrl() {
    const key = embedKey.trim()
    const userId = embedUserId.trim()
    if (!key || !userId) {
      setEmbedError('API key and User ID are required')
      return
    }
    setEmbedLoading(true)
    setEmbedError(null)
    setEmbedUrl('')
    try {
      const res = await fetch('/api/integrations/embed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          user_id: userId,
          course_id: embedCourseId.trim() || undefined,
          module_id: embedModuleId.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.embed_url) {
        setEmbedUrl(data.embed_url)
      } else {
        setEmbedError((data as { error?: string }).error || 'Failed to get embed URL')
      }
    } catch {
      setEmbedError('Request failed')
    } finally {
      setEmbedLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <Plug className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Integrations</h1>
          <p className="text-sm text-slate-400">
            Connect external LMSs, manage API access, and embed Sudar in other platforms.
          </p>
        </div>
      </div>

      {/* Provisioning checklist — one place for all levers */}
      <section className="mb-10">
        <h2 className="flex items-center gap-2 text-base font-medium text-slate-200 mb-4">
          <ListOrdered className="w-4 h-4 text-indigo-400" />
          Provisioning &amp; integrations checklist
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Set up Sudar in order: identity, then directory sync, LMS/ALP, AI keys, and data ingestion.
        </p>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 list-none">
          <li>
            <Link href="/help#identity" className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3 block hover:border-slate-600 transition-colors">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-medium">1</span>
              <div>
                <span className="text-sm font-medium text-slate-300">Identity</span>
                <p className="text-xs text-slate-500 mt-0.5">SSO (SAML/OIDC) via Supabase Auth</p>
              </div>
            </Link>
          </li>
          <li>
            <Link href="/help#directory" className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3 block hover:border-slate-600 transition-colors">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-medium">2</span>
              <div>
                <span className="text-sm font-medium text-slate-300">Directory</span>
                <p className="text-xs text-slate-500 mt-0.5">User sync (Provisioning API or HRIS/SIS)</p>
              </div>
            </Link>
          </li>
          <li>
            <a href="#alp" className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3 block hover:border-slate-600 transition-colors">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-medium">3</span>
              <div>
                <span className="text-sm font-medium text-slate-300">LMS / LTI</span>
                <p className="text-xs text-slate-500 mt-0.5">ALP API keys, LTI 1.3, embed (below)</p>
              </div>
            </a>
          </li>
          <li>
            <Link href="/settings/keys" className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3 block hover:border-slate-600 transition-colors">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-medium">4</span>
              <div>
                <span className="text-sm font-medium text-slate-300">AI &amp; API keys</span>
                <p className="text-xs text-slate-500 mt-0.5">Chat, embeddings, TTS, media</p>
              </div>
            </Link>
          </li>
          <li>
            <Link href="/help#data" className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3 block hover:border-slate-600 transition-colors">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-medium">5</span>
              <div>
                <span className="text-sm font-medium text-slate-300">Data</span>
                <p className="text-xs text-slate-500 mt-0.5">ALP events, batch ingestion</p>
              </div>
            </Link>
          </li>
        </ol>
      </section>

      <IntegrationVisualGuide />

      {/* ALP / API access */}
      <section id="alp" className="mb-10">
        <h2 className="flex items-center gap-2 text-base font-medium text-slate-200 mb-4">
          <Key className="w-4 h-4 text-indigo-400" />
          ALP & API access
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          The <strong className="text-slate-300">Adaptive Learning Layer (ALP)</strong> lets Moodle, Canvas, or other
          LMSs send learning events and use the Sudar tutor and next-action APIs without replacing your LMS. Your
          external systems call the Learn app with an API key. For <strong className="text-slate-300">LTI 1.3</strong> (Canvas, Blackboard, Moodle), <strong className="text-slate-300">SCORM 1.2</strong>, and <strong className="text-slate-300">xAPI/LRS</strong>, see the Integration guide and{' '}
          <a href="https://github.com/Dhanikesh-Karunanithi/Sudar/blob/main/docs/ENTERPRISE_PROVISIONING.md#lti--lms-options" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">Enterprise provisioning → LTI / LMS options</a>.
        </p>

        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Learn app base URL (for ALP endpoints)
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-md bg-slate-900 text-slate-300 text-sm font-mono border border-slate-700">
                {LEARN_BASE_URL || 'Set NEXT_PUBLIC_LEARN_APP_URL in Studio env'}
              </code>
              {LEARN_BASE_URL && (
                <button
                  type="button"
                  onClick={() => copy(LEARN_BASE_URL, 'base')}
                  className="p-2 rounded-md border border-slate-600 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                  title="Copy URL"
                >
                  {copied === 'base' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Integration API keys
            </label>
            <p className="text-sm text-slate-400 mb-3">
              Create keys for each LMS or partner. Use the key in the <code className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-xs">x-alp-api-key</code> header
              or <code className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-xs">Authorization: Bearer &lt;key&gt;</code>. Learn also accepts a single <code className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-xs">ALP_API_KEY</code> env var.
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Key name (e.g. Moodle production)"
                className="rounded-md bg-slate-900 border border-slate-600 px-3 py-2 text-sm text-white placeholder-slate-500 w-56"
              />
              <button
                type="button"
                onClick={createKey}
                disabled={creating}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create key
              </button>
            </div>
            {keysLoading ? (
              <p className="text-slate-500 text-sm">Loading…</p>
            ) : keys.length > 0 ? (
              <ul className="space-y-2">
                {keys.map((k) => (
                  <li key={k.id} className="flex items-center justify-between rounded-md bg-slate-900 px-3 py-2 border border-slate-700">
                    <span className="text-sm text-slate-300">{k.name}</span>
                    <span className="font-mono text-xs text-slate-500">{k.key_prefix}…</span>
                    <span className="text-xs text-slate-500">
                      {k.last_used_at ? `Used ${new Date(k.last_used_at).toLocaleDateString()}` : 'Never used'}
                    </span>
                    <button
                      type="button"
                      onClick={() => revokeKey(k.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800"
                      title="Revoke key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {rawKeyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setRawKeyModal(null)}>
              <div className="rounded-lg bg-slate-800 border border-slate-600 p-4 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                <p className="text-sm text-slate-300 mb-2">Copy this key now. It won&apos;t be shown again.</p>
                <div className="flex gap-2">
                  <code className="flex-1 break-all px-3 py-2 rounded bg-slate-900 text-slate-300 text-xs font-mono">
                    {rawKeyModal.raw_key}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(rawKeyModal.raw_key, 'raw')}
                    className="p-2 rounded border border-slate-600 text-slate-400 hover:bg-slate-700"
                  >
                    {copied === 'raw' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setRawKeyModal(null)}
                  className="mt-3 w-full py-2 rounded bg-slate-700 text-slate-200 text-sm font-medium hover:bg-slate-600"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          <div className="pt-2">
            <a
              href="https://github.com/Dhanikesh-Karunanithi/Sudar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
            >
              <ExternalLink className="w-4 h-4" />
              ALP API documentation
            </a>
            <span className="text-slate-500 text-sm ml-1">(docs/ALP_API.md in repo — endpoints, request bodies, event ingestion)</span>
          </div>
        </div>
      </section>

      {/* Embed Sudar */}
      <section className="mb-10">
        <h2 className="flex items-center gap-2 text-base font-medium text-slate-200 mb-4">
          <Code className="w-4 h-4 text-indigo-400" />
          Embed Sudar in other platforms
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          You can embed the Sudar tutor or the next-action recommendation widget in your LMS (e.g. as a Moodle block or
          LTI tool), your intranet, or a partner portal. Your backend calls the ALP API with the learner&apos;s{' '}
          <code className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-xs">user_id</code> (mapped from your
          LMS user).
        </p>

        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-slate-300">Sudar Chat (tutor)</span>
              </div>
              <p className="text-xs text-slate-500 mb-2">
                POST to the tutor API from your LMS when the learner sends a message. Your UI can be a sidebar, modal, or
                inline chat.
              </p>
              <code className="block text-xs text-slate-400 font-mono break-all">
                POST {(LEARN_BASE_URL || 'https://your-learn-app.com')}/api/alp/tutor/query
              </code>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-slate-300">Next-action widget</span>
              </div>
              <p className="text-xs text-slate-500 mb-2">
                Call the next-action API to show a &quot;What to do next&quot; card on your LMS dashboard.
              </p>
              <code className="block text-xs text-slate-400 font-mono break-all">
                POST {(LEARN_BASE_URL || 'https://your-learn-app.com')}/api/alp/next-action
              </code>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-4 mt-4">
            <p className="text-sm font-medium text-slate-300 mb-3">Generate embed link (iframe)</p>
            <p className="text-xs text-slate-500 mb-3">
              Get a short-lived URL to embed the Sudar chat in your LMS. Use your integration API key and the learner&apos;s Sudar user ID.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 mb-3">
              <input
                type="text"
                value={embedUserId}
                onChange={(e) => setEmbedUserId(e.target.value)}
                placeholder="User ID (Sudar learner uuid)"
                className="rounded-md bg-slate-900 border border-slate-600 px-3 py-2 text-sm text-white placeholder-slate-500"
              />
              <input
                type="password"
                value={embedKey}
                onChange={(e) => setEmbedKey(e.target.value)}
                placeholder="API key (from above or ALP_API_KEY)"
                className="rounded-md bg-slate-900 border border-slate-600 px-3 py-2 text-sm text-white placeholder-slate-500"
              />
              <input
                type="text"
                value={embedCourseId}
                onChange={(e) => setEmbedCourseId(e.target.value)}
                placeholder="Course ID (optional)"
                className="rounded-md bg-slate-900 border border-slate-600 px-3 py-2 text-sm text-white placeholder-slate-500"
              />
              <input
                type="text"
                value={embedModuleId}
                onChange={(e) => setEmbedModuleId(e.target.value)}
                placeholder="Module ID (optional)"
                className="rounded-md bg-slate-900 border border-slate-600 px-3 py-2 text-sm text-white placeholder-slate-500"
              />
            </div>
            <button
              type="button"
              onClick={getEmbedUrl}
              disabled={embedLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
            >
              {embedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Get embed URL
            </button>
            {embedError && <p className="text-red-400 text-sm mt-2">{embedError}</p>}
            {embedUrl && (
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 break-all px-3 py-2 rounded bg-slate-900 text-slate-300 text-xs font-mono">
                  {embedUrl}
                </code>
                <button
                  type="button"
                  onClick={() => copy(embedUrl, 'embed')}
                  className="p-2 rounded border border-slate-600 text-slate-400 hover:bg-slate-700"
                >
                  {copied === 'embed' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Use this URL as the <code className="text-slate-400">src</code> of an iframe. Link expires in 1 hour.
            </p>
          </div>
        </div>
      </section>

      {/* Event ingestion */}
      <section className="mb-10">
        <h2 className="flex items-center gap-2 text-base font-medium text-slate-200 mb-4">
          <Plug className="w-4 h-4 text-indigo-400" />
          Event ingestion (SudarMemory)
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          So that Sudar has a full picture of the learner, your LMS should send learning events (completions, quiz
          attempts, time-on-task) to the Learn app. One endpoint accepts batches of events.
        </p>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <code className="block text-sm text-slate-400 font-mono mb-2">
            POST {(LEARN_BASE_URL || 'https://your-learn-app.com')}/api/alp/events
          </code>
          <p className="text-xs text-slate-500">
            Body: <code className="text-slate-400">{'{ user_id, events: [ { event_type, course_id?, module_id?, payload?, ... } ] }'}</code>.
            Map your LMS user to Sudar <code className="text-slate-400">user_id</code> (e.g. via LTI or SSO). See ALP API
            doc for <code className="text-slate-400">event_type</code> values and schema.
          </p>
        </div>
      </section>

      {/* Enterprise & university */}
      <section>
        <h2 className="flex items-center gap-2 text-base font-medium text-slate-200 mb-4">
          <Building2 className="w-4 h-4 text-indigo-400" />
          Enterprise & university setup
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Connect Sudar to existing identity, directory, and data systems. Configure SSO, user sync, and batch event
          ingestion from the admin portal and documentation.
        </p>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/settings/keys" className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 block hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-slate-300">AI & API Keys</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Configure AI providers (OpenRouter, Together, OpenAI, Anthropic), embeddings, TTS, and media keys. See status and step-by-step instructions.
            </p>
            <span className="text-xs text-indigo-400 hover:text-indigo-300">Open AI & API Keys →</span>
          </Link>
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-slate-300">SSO (SAML / OIDC)</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Single sign-on with Azure AD, Okta, Google Workspace, or other identity providers. Configure in your
              Supabase project (Auth → Providers) and optionally store status here.
            </p>
            <p className="text-xs text-slate-500 mb-2">
              <ExternalLink className="w-3 h-3 inline mr-0.5" />
              <a
                href="https://supabase.com/docs/guides/auth/sso"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300"
              >
                Supabase SSO docs
              </a>
            </p>
            <Link href="/help" className="text-xs text-indigo-400 hover:text-indigo-300">How to set this up →</Link>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-slate-300">Directory / user sync</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Sync users from HRIS (Workday, BambooHR, Rippling) or university SIS via a provisioning API or webhooks.
              Map external user IDs to Sudar for idempotent sync.
            </p>
            <p className="text-xs text-slate-500 mb-2">
              See the integration guide for user mapping (LTI/SSO or directory sync) and ALP events.
            </p>
            <Link href="/help" className="text-xs text-indigo-400 hover:text-indigo-300">How to set this up →</Link>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-slate-300">Data lakes & batch ingestion</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Use the same ALP events API with your API key and Learn base URL. Batch jobs can read from your data
              lake (e.g. S3, Delta) and POST events; map your user identifier to Sudar <code className="text-slate-400">user_id</code> (email or external_id).
            </p>
            <p className="text-xs text-slate-500 mb-2">
              Use the base URL and keys above; see ALP API and integration guide for event schema.
            </p>
            <Link href="/help" className="text-xs text-indigo-400 hover:text-indigo-300">How to set this up →</Link>
          </div>
        </div>
        <p className="text-sm text-slate-400 mb-3">
          <strong className="text-slate-300">Recommended for…</strong> K-12: Google SSO, Clever/ClassLink, ALP + LTI. Higher ed: SAML/OIDC, SIS sync, LTI 1.3, SCORM. Corporate: Azure AD/Okta, Workday/BambooHR sync, ALP + xAPI. See Help &amp; Guides and the enterprise provisioning doc in repo.
        </p>
        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/30 p-4 space-y-2">
          <a
            href="https://github.com/Dhanikesh-Karunanithi/Sudar/blob/main/docs/INTEGRATION_GUIDE.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 block"
          >
            <ExternalLink className="w-4 h-4" />
            Integration guide — LMS, ERP, and enterprise setup
          </a>
          <a
            href="https://github.com/Dhanikesh-Karunanithi/Sudar/blob/main/docs/ENTERPRISE_PROVISIONING.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 block"
          >
            <ExternalLink className="w-4 h-4" />
            Enterprise provisioning — recommended setups (K-12, Higher ed, Corporate) and scaling
          </a>
        </div>
      </section>
    </div>
  )
}

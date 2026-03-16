'use client'

import { useState, useEffect, useCallback } from 'react'
import { Key, ExternalLink, ChevronDown, ChevronUp, Copy, Check, Info } from 'lucide-react'
import { PROVIDER_KEYS } from '@/lib/ai/providerConfig'

type KeyStatus = { id: string; name: string; envVar: string; category: string; status: 'configured' | 'not_set'; signupUrl: string; steps: string[]; description?: string }

const CATEGORY_LABELS: Record<string, string> = {
  chat: 'Chat / LLM',
  embed: 'Embeddings',
  tts: 'TTS',
  media: 'Media search',
  required: 'Required',
  integrations: 'Integrations',
  optional: 'Optional',
}

export default function SettingsKeysPage() {
  const [keys, setKeys] = useState<KeyStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    const res = await fetch('/api/settings/keys-status')
    if (res.ok) {
      const data = await res.json()
      setKeys(data.keys ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const copyEnvSnippet = (envVar: string) => {
    const snippet = `${envVar}=your_value_here`
    navigator.clipboard.writeText(snippet)
    setCopied(envVar)
    setTimeout(() => setCopied(null), 2000)
  }

  const copyAllStudio = () => {
    const lines = PROVIDER_KEYS.map((k) => `${k.envVar}=your_value_here`)
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied('all')
    setTimeout(() => setCopied(null), 2000)
  }

  const byCategory = keys.reduce((acc, k) => {
    const c = k.category as keyof typeof CATEGORY_LABELS
    if (!acc[c]) acc[c] = []
    acc[c].push(k)
    return acc
  }, {} as Record<string, KeyStatus[]>)

  const order = ['required', 'chat', 'embed', 'tts', 'media', 'integrations', 'optional']

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-2">
        <Key className="w-6 h-6 text-indigo-400" />
        <h1 className="text-xl font-semibold text-white">AI & API Keys</h1>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        See which keys are configured and how to get them. Keys are set in your deployment environment (.env.local or host). Values are never shown here.
      </p>

      {/* Where to set these */}
      <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 mb-6">
        <h2 className="text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Where to set these
        </h2>
        <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside mb-3">
          <li><strong className="text-slate-300">Local:</strong> Add variables to <code className="px-1 rounded bg-slate-700 text-slate-300 text-xs">.env.local</code> in Studio (and Learn/Intelligence if you run them). Restart dev server.</li>
          <li><strong className="text-slate-300">Vercel:</strong> Project → Settings → Environment Variables. Add each; redeploy.</li>
          <li><strong className="text-slate-300">Railway / Render:</strong> Add as environment variables in the dashboard and redeploy.</li>
        </ul>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyAllStudio}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-700 text-slate-200 text-sm hover:bg-slate-600"
          >
            {copied === 'all' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            Copy all variable names (placeholders)
          </button>
        </div>
      </section>

      {/* Full reference */}
      <p className="text-sm text-slate-400 mb-4">
        Full list and descriptions: <code className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-xs">docs/ENV_REFERENCE.md</code> in the repo.
      </p>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : (
        <div className="space-y-6">
          {order.map((cat) => {
            const items = byCategory[cat]
            if (!items?.length) return null
            return (
              <section key={cat} className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
                <h2 className="px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-800/80 border-b border-slate-700">
                  {CATEGORY_LABELS[cat] ?? cat}
                </h2>
                <ul className="divide-y divide-slate-700">
                  {items.map((k) => (
                    <li key={k.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-sm font-medium text-white">{k.name}</span>
                          <code className="text-xs text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded truncate max-w-[180px]" title={k.envVar}>
                            {k.envVar}
                          </code>
                          <span
                            className={k.status === 'configured'
                              ? 'text-xs px-2 py-0.5 rounded bg-green-900/50 text-green-400'
                              : 'text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-500'}
                          >
                            {k.status === 'configured' ? 'Configured' : 'Not set'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyEnvSnippet(k.envVar)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                          >
                            {copied === k.envVar ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            Copy name
                          </button>
                          {k.signupUrl ? (
                            <a
                              href={k.signupUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-indigo-400 hover:text-indigo-300 hover:bg-slate-700"
                            >
                              Get key <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setExpandedId(expandedId === k.id ? null : k.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                          >
                            How to get this key {expandedId === k.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      {k.description ? (
                        <p className="text-xs text-slate-500 mt-1">{k.description}</p>
                      ) : null}
                      {expandedId === k.id && (
                        <div className="mt-3 pl-3 border-l-2 border-slate-600 space-y-2">
                          <p className="text-xs font-medium text-slate-400">Steps:</p>
                          <ol className="list-decimal list-inside text-sm text-slate-400 space-y-1">
                            {k.steps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                          {k.signupUrl ? (
                            <a
                              href={k.signupUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                            >
                              Open {k.name} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : null}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}

      {/* Recommendations */}
      <section className="mt-8 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <h2 className="text-sm font-medium text-slate-200 mb-2">Recommendations</h2>
        <ul className="text-sm text-slate-400 space-y-1">
          <li><strong className="text-slate-300">Zero budget:</strong> Together AI + free tier Supabase.</li>
          <li><strong className="text-slate-300">Enterprise:</strong> OpenRouter or OpenAI + your IdP (SSO).</li>
          <li><strong className="text-slate-300">Local / custom:</strong> Set AI_CHAT_BASE_URL and AI_CHAT_API_KEY (or OPENAI_API_KEY) for your own endpoint.</li>
        </ul>
      </section>
    </div>
  )
}

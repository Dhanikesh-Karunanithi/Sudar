'use client'

import Link from 'next/link'
import { HelpCircle, Key, Building2, ArrowRight, ExternalLink, BookOpen } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="w-6 h-6 text-indigo-400" />
        <h1 className="text-xl font-semibold text-white">Guides &amp; Help</h1>
      </div>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-3">Getting started</h2>
        <p className="text-sm text-slate-400 mb-3">
          First-time setup order: configure Supabase (auth and database), then add at least one AI provider key so you can generate courses and use the tutor.
        </p>
        <ol className="list-decimal list-inside text-sm text-slate-400 space-y-2 mb-4">
          <li>Create a Supabase project and add <code className="text-slate-300">NEXT_PUBLIC_SUPABASE_URL</code>, <code className="text-slate-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and <code className="text-slate-300">SUPABASE_SERVICE_ROLE_KEY</code> to your env.</li>
          <li>Set <code className="text-slate-300">NEXTAUTH_URL</code> and <code className="text-slate-300">NEXTAUTH_SECRET</code> for session auth.</li>
          <li>Add at least one AI key (e.g. <Link href="/settings/keys" className="text-indigo-400 hover:text-indigo-300">AI &amp; API Keys</Link>) — OpenRouter, Together, or OpenAI.</li>
          <li>Optional: configure <Link href="/integrations" className="text-indigo-400 hover:text-indigo-300">Integrations</Link> (ALP keys, embed URL, SSO).</li>
        </ol>
        <Link href="/settings/keys" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300">
          Open AI &amp; API Keys <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Key className="w-4 h-4" />
          Getting your API keys
        </h2>
        <p className="text-sm text-slate-400 mb-3">
          Every provider Sudar uses has step-by-step instructions and signup links in one place.
        </p>
        <ul className="text-sm text-slate-400 space-y-1 mb-4">
          <li>Chat/LLM: OpenRouter, Together AI, OpenAI, Anthropic — see <Link href="/settings/keys" className="text-indigo-400 hover:text-indigo-300">AI &amp; API Keys</Link> and expand &quot;How to get this key&quot; for each.</li>
          <li>Embeddings: Together or OpenAI (set <code className="text-slate-300">EMBED_PROVIDER</code> in Learn).</li>
          <li>TTS: OpenAI or Sudar Intelligence (Edge-TTS).</li>
          <li>Media: Google, Pexels, Unsplash, Giphy — optional; same page lists signup links.</li>
        </ul>
        <Link href="/settings/keys" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300">
          Open AI &amp; API Keys <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Provisioning checklist
        </h2>
        <p className="text-sm text-slate-400 mb-3">
          For institutions and enterprises: connect identity, directory, LMS, AI keys, and data in this order.
        </p>
        <ol className="list-decimal list-inside text-sm text-slate-400 space-y-2">
          <li id="identity"><strong className="text-slate-300">Identity:</strong> SSO (SAML/OIDC) — configure in your Supabase project (Auth → Providers). Optionally record status in Org settings.</li>
          <li id="directory"><strong className="text-slate-300">Directory / user sync:</strong> Use the provisioning API or cron to sync users from HRIS/SIS; see integration guide for mapping.</li>
          <li id="lms"><strong className="text-slate-300">LMS / LTI:</strong> Use ALP API keys from Integrations; embed tutor or next-action in Canvas, Blackboard, or Moodle via LTI or embed URL.</li>
          <li id="ai-keys"><strong className="text-slate-300">AI keys:</strong> Configure in <Link href="/settings/keys" className="text-indigo-400 hover:text-indigo-300">AI &amp; API Keys</Link>.</li>
          <li id="data"><strong className="text-slate-300">Data:</strong> Send learning events to the ALP events endpoint with your API key; batch jobs can POST from your data lake.</li>
        </ol>
        <div className="mt-4">
          <Link href="/integrations" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300">
            Open Integrations <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-3">Enterprise &amp; scaling</h2>
        <p className="text-sm text-slate-400 mb-3">
          Recommended setups by segment:
        </p>
        <ul className="text-sm text-slate-400 space-y-2">
          <li><strong className="text-slate-300">K-12:</strong> Google Workspace SSO (Supabase); Clever/ClassLink or roster sync; ALP + LTI if you use an LMS. AI: Together or OpenRouter.</li>
          <li><strong className="text-slate-300">Higher ed:</strong> University SAML/OIDC; SIS sync via provisioning API; LTI 1.3 for Canvas/Blackboard/Moodle; SCORM. AI: OpenRouter or OpenAI.</li>
          <li><strong className="text-slate-300">Corporate:</strong> Azure AD / Okta SSO; Workday/BambooHR/Rippling sync; ALP for intranet; xAPI for data lake. AI: OpenAI/Claude for compliance or OpenRouter.</li>
        </ul>
        <p className="text-sm text-slate-500 mt-3">
          Scaling: use a dedicated Supabase project; scale BYTEOS_INTELLIGENCE_URL; document rate limits for ALP keys.
        </p>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <a
          href="https://github.com/Dhanikesh-Karunanithi/Sudar"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
        >
          <BookOpen className="w-4 h-4" />
          Integration guide (docs/INTEGRATION_GUIDE.md) <ExternalLink className="w-3 h-3" />
        </a>
        <p className="text-xs text-slate-500 mt-1">LMS, ERP, user mapping, ALP events, embed, data pipelines.</p>
      </section>
    </div>
  )
}

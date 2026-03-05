'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Route, Loader2, Zap, Lock, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function NewPathPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isAdaptive, setIsAdaptive] = useState(false)
  const [isMandatory, setIsMandatory] = useState(false)
  const [issuesCertificate, setIssuesCertificate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true); setError(null)

    const res = await fetch('/api/paths', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), description: description.trim() || null, is_adaptive: isAdaptive, is_mandatory: isMandatory, issues_certificate: issuesCertificate }),
    })

    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Failed to create path')
      setLoading(false); return
    }
    const { id } = await res.json()
    router.push(`/paths/${id}`)
  }

  const Toggle = ({ label, desc, value, onChange, icon: Icon, color }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void; icon: React.ElementType; color: string }) => (
    <button type="button" onClick={() => onChange(!value)}
      className={cn('w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all',
        value ? `${color} ` : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
      )}>
      <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', value ? 'opacity-100' : 'opacity-40')} />
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <div className={cn('w-9 h-5 rounded-full flex items-center transition-all shrink-0 mt-0.5 px-0.5', value ? 'bg-indigo-600 justify-end' : 'bg-slate-700 justify-start')}>
        <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
      </div>
    </button>
  )

  return (
    <div className="p-8 max-w-xl mx-auto space-y-6">
      <Link href="/paths" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" />Back to paths
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center">
          <Route className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">New learning path</h1>
          <p className="text-slate-400 text-sm">Configure the path, then add courses in the editor.</p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}

      <form onSubmit={handleCreate} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Path title <span className="text-red-400">*</span></label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
            placeholder="e.g. New Employee Onboarding, Data Literacy Programme"
            className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Description <span className="text-slate-600 font-normal">(optional)</span></label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            placeholder="What will learners gain from completing this path?"
            className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm resize-none" />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-300">Path settings</p>
          <Toggle label="Adaptive path" desc="Sudar reorders optional courses per learner based on their knowledge, goals, and pace. Mandatory courses always appear in fixed order." value={isAdaptive} onChange={setIsAdaptive} icon={Zap} color="bg-violet-950/40 border-violet-500/30" />
          <Toggle label="Org mandatory" desc="All learners in the organisation are required to complete this path (e.g. onboarding, compliance). Appears prominently in Learn." value={isMandatory} onChange={setIsMandatory} icon={Lock} color="bg-amber-950/30 border-amber-500/30" />
          <Toggle label="Issues certificate" desc="Learners receive a shareable certificate with a public verification link on completing all mandatory courses." value={issuesCertificate} onChange={setIssuesCertificate} icon={Award} color="bg-yellow-950/30 border-yellow-500/30" />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={loading || !title.trim()}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : <><Route className="w-4 h-4" />Create path</>}
          </button>
          <Link href="/paths" className="px-4 py-2.5 text-slate-400 hover:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-800 transition-all">Cancel</Link>
        </div>
      </form>
    </div>
  )
}

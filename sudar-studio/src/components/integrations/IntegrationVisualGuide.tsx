'use client'

import { useState } from 'react'
import {
  BookOpen,
  Plug,
  Brain,
  ChevronDown,
  ChevronUp,
  Database,
  MessageSquare,
  LayoutDashboard,
  Code,
  ArrowRight,
  ExternalLink,
  Layers,
  Box,
} from 'lucide-react'

const steps = [
  {
    num: 1,
    title: 'Create an API key',
    desc: 'In this page, create an Integration API key. Use one key per LMS or partner. Send it in the x-alp-api-key header.',
    icon: Plug,
  },
  {
    num: 2,
    title: 'Send events (SudarMemory)',
    desc: 'Your LMS or ERP sends learning events (completions, quiz attempts, time-on-task) to POST /api/alp/events. Sudar builds the Digital Learner Twin.',
    icon: Database,
  },
  {
    num: 3,
    title: 'Add tutor or next-action',
    desc: 'Call POST /api/alp/tutor/query for chat, or POST /api/alp/next-action for a "What to do next" widget. Or use the embed URL for a ready-made chat iframe.',
    icon: MessageSquare,
  },
  {
    num: 4,
    title: 'Map your users',
    desc: 'Map each learner in your system to a Sudar user_id (e.g. via LTI, SSO, or a directory sync). Same user_id = same Twin across sessions.',
    icon: Box,
  },
]

const legoBlocks = [
  {
    name: 'SudarMemory',
    short: 'Events in',
    icon: Database,
    color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
    desc: 'POST /api/alp/events — completions, quizzes, time-on-task',
  },
  {
    name: 'SudarChat',
    short: 'Tutor',
    icon: MessageSquare,
    color: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300',
    desc: 'POST /api/alp/tutor/query — Q&A with memory',
  },
  {
    name: 'SudarRecommend',
    short: 'Next action',
    icon: LayoutDashboard,
    color: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    desc: 'POST /api/alp/next-action — "What to do next"',
  },
  {
    name: 'Embed',
    short: 'Chat iframe',
    icon: Code,
    color: 'bg-violet-500/20 border-violet-500/40 text-violet-300',
    desc: 'Embed URL — drop-in chat widget',
  },
]

export function IntegrationVisualGuide() {
  const [open, setOpen] = useState(true)

  return (
    <section className="mb-10 rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-800/70 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Layers className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-medium text-slate-200">Visual guide — How integrations work</h2>
            <p className="text-xs text-slate-500">Lego-style blocks, flow diagrams, and step-by-step for LMS / ERP / any ecosystem</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-700 p-6 space-y-8">
          {/* Flow: Your system → ALP → Twin */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              High-level flow
            </h3>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 py-4 px-4 rounded-lg bg-slate-900/60 border border-slate-700">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-700/80 border border-slate-600">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-200">Your LMS / ERP / Intranet</span>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 shrink-0" aria-hidden />
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40">
                <Plug className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-indigo-200">ALP (Sudar Learn API)</span>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 shrink-0" aria-hidden />
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-700/80 border border-slate-600">
                <Brain className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-200">Digital Learner Twin</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Your system sends events and calls tutor/next-action; ALP updates and reads the Twin. No need to replace your LMS.
            </p>
          </div>

          {/* Lego blocks */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Box className="w-4 h-4" />
              Lego-style integration blocks
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pick the blocks you need. Each connects to the same ALP with one API key; combine Events + Tutor, or Events + Next-action, or Embed only.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {legoBlocks.map((block) => (
                <div
                  key={block.name}
                  className={`rounded-lg border p-3 ${block.color}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <block.icon className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-medium">{block.name}</span>
                  </div>
                  <p className="text-xs opacity-90">{block.short}</p>
                  <p className="text-xs opacity-75 mt-1.5">{block.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-step */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Add Sudar to your ecosystem (4 steps)</h3>
            <ol className="space-y-3">
              {steps.map((step) => (
                <li key={step.num} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-500/40 text-sm font-medium text-indigo-300">
                    {step.num}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200">{step.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                  </div>
                  <step.icon className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" aria-hidden />
                </li>
              ))}
            </ol>
          </div>

          {/* Link to full guide */}
          <div className="pt-2 border-t border-slate-700">
            <a
              href="https://github.com/Dhanikesh-Karunanithi/Sudar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
            >
              <ExternalLink className="w-4 h-4" />
              Full integration guide (diagrams, LMS/ERP/ecosystem patterns)
            </a>
            <span className="text-slate-500 text-xs ml-1">— <code className="text-slate-400">docs/INTEGRATION_GUIDE.md</code> · Mermaid diagrams, Moodle/Canvas/ERP examples</span>
          </div>
        </div>
      )}
    </section>
  )
}

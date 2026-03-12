'use client'

import { Sparkles, Plus, Loader2, FileText, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const AI_PROMPT_IDEAS = [
  'Explain with real-world examples',
  'Include key takeaways',
  'Add a short summary',
  'Use simple language for beginners',
  'Add definitions for key terms',
  'Research from the web and cite sources',
]

export interface ContentToolsPanelProps {
  onGenerateOutline: () => void
  onAddModule: () => void
  generatingOutline: boolean
  modules: { id: string; title: string }[]
  expandedModuleId: string | null
  onJumpToModule: (moduleId: string, index: number) => void
  onPromptIdeaSelect?: (idea: string) => void
  onOpenMediaPeek?: () => void
}

export function ContentToolsPanel({
  onGenerateOutline,
  onAddModule,
  generatingOutline,
  modules,
  expandedModuleId,
  onJumpToModule,
  onPromptIdeaSelect,
  onOpenMediaPeek,
}: ContentToolsPanelProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {onOpenMediaPeek && (
          <button
            type="button"
            onClick={onOpenMediaPeek}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-all text-left"
          >
            <ImageIcon className="w-3.5 h-3.5 shrink-0" />
            View project media
          </button>
        )}
        {modules.length === 0 && (
          <button
            type="button"
            onClick={onGenerateOutline}
            disabled={generatingOutline}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left',
              'bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 disabled:opacity-60'
            )}
          >
            {generatingOutline ? (
              <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
            )}
            {generatingOutline ? 'Generating outline…' : 'Generate outline with AI'}
          </button>
        )}
        <button
          type="button"
          onClick={onAddModule}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-all text-left"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          Add module
        </button>
      </div>

      {modules.length > 0 && (
        <div className="space-y-0.5">
          <p className="px-3 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Jump to module
          </p>
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {modules.map((mod, idx) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => onJumpToModule(mod.id, idx)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-left transition-all truncate',
                  expandedModuleId === mod.id
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                )}
              >
                <span className="text-slate-600 shrink-0 w-4">{idx + 1}.</span>
                <span className="truncate">{mod.title || 'Untitled'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <p className="px-3 text-[10px] font-medium uppercase tracking-wider text-slate-500">
          AI prompt ideas
        </p>
        <div className="flex flex-wrap gap-1">
          {AI_PROMPT_IDEAS.map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => onPromptIdeaSelect?.(idea)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-slate-400 hover:text-violet-300 hover:bg-violet-600/15 border border-transparent hover:border-violet-500/20 transition-all"
            >
              <FileText className="w-3 h-3 shrink-0" />
              {idea}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

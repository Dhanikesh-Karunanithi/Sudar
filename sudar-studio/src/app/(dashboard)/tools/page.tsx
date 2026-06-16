import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  LayoutGrid,
  ExternalLink,
  HelpCircle,
} from 'lucide-react'

const TOOLS = [
  {
    name: 'Gamification',
    href: '/tools/gamification',
    status: 'Available',
    statusTone: 'green' as const,
    description: 'Configure quests, coins, achievements, and org leaderboard settings.',
    helpHref: '/help/article/learners/dashboard-and-navigation',
  },
  {
    name: 'Notifications',
    href: '/tools/notifications',
    status: 'Available',
    statusTone: 'green' as const,
    description: 'Compliance reminders and learner notification templates for your org.',
    helpHref: '/help/article/admins/studio-tools',
  },
  {
    name: 'SudarArt',
    href: '/tools/sudarart',
    status: 'Paused',
    statusTone: 'amber' as const,
    description: 'AI image generation for course covers — temporarily disabled while quality is improved.',
    helpHref: '/help/article/admins/studio-tools',
  },
]

export const metadata = { title: 'Studio tools' }

export default async function ToolsHubPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
          <LayoutGrid className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Studio tools</h1>
          <p className="text-sm text-muted-foreground">
            Utilities beyond core course authoring. Status reflects what ships today.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <div key={tool.name} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-foreground">{tool.name}</h2>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  tool.statusTone === 'green'
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                    : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                }`}
              >
                {tool.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{tool.description}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href={tool.href} className="text-indigo-400 hover:text-indigo-300 font-medium">
                Open tool →
              </Link>
              <Link href={tool.helpHref} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Help
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">Related</p>
        <ul className="space-y-1">
          <li>
            <Link href="/integrations" className="text-indigo-400 hover:underline inline-flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5" /> Integrations &amp; ALP
            </Link>
          </li>
          <li>
            <Link href="/governance" className="text-indigo-400 hover:underline inline-flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5" /> Governance &amp; trust
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { CheckCircle2, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PathNode {
  course_id: string
  title: string
  order_index: number
  is_mandatory?: boolean
}

type NodeStatus = 'completed' | 'current' | 'locked'

export function PathNodeGraph({
  nodes,
  statusByCourseId,
}: {
  nodes: PathNode[]
  statusByCourseId: Record<string, NodeStatus>
}) {
  if (!nodes.length) return null

  return (
    <div className="relative rounded-5xl border border-border bg-muted/30 p-6 md:p-8 overflow-x-auto">
      <div className="flex items-start justify-between gap-4 min-w-max" style={{ minHeight: '120px' }}>
        {nodes.map((node, i) => {
          const status = statusByCourseId[node.course_id] ?? 'locked'
          const isLast = i === nodes.length - 1
          return (
            <div key={node.course_id} className="flex flex-col items-center flex-1 min-w-[100px] max-w-[140px]">
              <Link
                href={status !== 'locked' ? (status === 'completed' ? `/courses/${node.course_id}/learn` : `/courses/${node.course_id}`) : '#'}
                className={cn(
                  'node-circle flex-shrink-0',
                  status === 'completed' && '!border-success bg-success/10',
                  status === 'current' && '!border-primary animate-pulse',
                  status === 'locked' && '!border-border opacity-60 cursor-not-allowed pointer-events-none'
                )}
              >
                {status === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6 text-success" />
                ) : (
                  <BookOpen className={cn('w-6 h-6', status === 'current' ? 'text-primary' : 'text-muted-foreground')} />
                )}
              </Link>
              {!isLast && (
                <div
                  className="flex-1 w-0.5 min-h-[24px] mt-2 mb-1"
                  style={{
                    background: status === 'completed' ? 'var(--success)' : 'var(--border)',
                    opacity: status === 'completed' ? 0.6 : 0.4,
                  }}
                />
              )}
              <span className="text-xs font-semibold text-card-foreground text-center line-clamp-2 mt-1">
                {node.title}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

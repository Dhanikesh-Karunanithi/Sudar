'use client'

import { useMemo, useState } from 'react'
import { Network, Loader2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MindMapNode {
  label: string
  /** Optional one-sentence insight shown on hover. */
  insight?: string
  children?: MindMapNode[]
}

// ── Color palette ────────────────────────────────────────────────────────────
// Each top-level branch gets its own color family.
// depth-0 (root) → dark slate | depth-1 → solid color, white text
// depth-2 → colored stroke, transparent fill, colored text
// depth-3+ → no box, colored label text only

const BRANCH_COLORS: Array<{
  solid: string        // background for depth-1 nodes
  stroke: string       // border for depth-2 nodes / line color
  label: string        // text color for depth-2+ nodes
  line: string         // edge stroke (same as stroke, a bit lighter)
}> = [
  { solid: '#3B82F6', stroke: '#2563EB', label: '#1D4ED8', line: '#93C5FD' },
  { solid: '#10B981', stroke: '#059669', label: '#065F46', line: '#6EE7B7' },
  { solid: '#F59E0B', stroke: '#D97706', label: '#92400E', line: '#FCD34D' },
  { solid: '#8B5CF6', stroke: '#7C3AED', label: '#5B21B6', line: '#C4B5FD' },
  { solid: '#EF4444', stroke: '#DC2626', label: '#991B1B', line: '#FCA5A5' },
  { solid: '#06B6D4', stroke: '#0891B2', label: '#155E75', line: '#67E8F9' },
  { solid: '#F97316', stroke: '#EA580C', label: '#9A3412', line: '#FDBA74' },
  { solid: '#EC4899', stroke: '#DB2777', label: '#9D174D', line: '#F9A8D4' },
]

// ── Layout constants ─────────────────────────────────────────────────────────
const ROW_H = 52          // vertical space allocated per leaf node
const COL_GAP = 48        // horizontal gap between node right edge and next column
const PAD = 24            // canvas padding top/bottom/left/right
const NODE_H = [44, 36, 30, 28] as const  // box height by depth (capped at index 3)
const FONT_PX = [15, 13, 12, 11] as const // font size by depth
const MAX_LABEL = [22, 20, 20, 20] as const // max chars before wrapping estimate changes width

// ── Types ────────────────────────────────────────────────────────────────────
interface PlacedNode {
  key: string
  label: string
  insight?: string
  x: number    // left edge
  y: number    // vertical center
  w: number    // box width
  h: number    // box height
  depth: number
  colorIdx: number  // index into BRANCH_COLORS; -1 = root
  hasChildren: boolean
}

interface PlacedEdge {
  x1: number; y1: number   // parent node right-center
  x2: number; y2: number   // child node left-center
  colorIdx: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function countLeaves(node: MindMapNode): number {
  if (!node.children?.length) return 1
  return node.children.reduce((s, c) => s + countLeaves(c), 0)
}

function estimateWidth(label: string, depth: number): number {
  const dp = Math.min(depth, 3)
  const fpx = FONT_PX[dp]
  // rough char width at given font size
  const single = label.length * fpx * 0.58 + 24
  // If text wraps to 2 lines width is roughly half but we keep it reasonable
  return Math.min(180, Math.max(80, Math.round(single)))
}

// ── Layout engine ─────────────────────────────────────────────────────────────
function buildLayout(root: MindMapNode) {
  // Pass 1 — measure max column width at each depth
  const maxWByDepth: number[] = []
  function measure(node: MindMapNode, depth: number) {
    const w = estimateWidth(node.label, depth)
    maxWByDepth[depth] = Math.max(maxWByDepth[depth] ?? 0, w)
    node.children?.forEach(c => measure(c, depth + 1))
  }
  measure(root, 0)

  // Pass 2 — compute column left-edge x for each depth
  const colX: number[] = [PAD]
  for (let d = 1; d < maxWByDepth.length; d++) {
    colX[d] = colX[d - 1] + (maxWByDepth[d - 1] ?? 90) + COL_GAP
  }

  const totalLeaves = countLeaves(root)
  const lastD = maxWByDepth.length - 1
  const canvasW = (colX[lastD] ?? PAD) + (maxWByDepth[lastD] ?? 90) + PAD
  const canvasH = totalLeaves * ROW_H + PAD * 2

  const nodes: PlacedNode[] = []
  const edges: PlacedEdge[] = []
  let seq = 0

  function place(
    node: MindMapNode,
    depth: number,
    rowOffset: number,
    colorIdx: number,
    parentX?: number,
    parentY?: number,
    parentW?: number
  ) {
    const dp = Math.min(depth, 3)
    const leaves = countLeaves(node)
    const yCenter = PAD + rowOffset + (leaves * ROW_H) / 2
    const x = colX[depth] ?? PAD
    const w = maxWByDepth[depth] ?? 90
    const h = NODE_H[dp]

    nodes.push({
      key: `n${seq++}`,
      label: node.label,
      insight: node.insight,
      x, y: yCenter, w, h, depth,
      colorIdx,
      hasChildren: !!node.children?.length,
    })

    if (parentX !== undefined && parentY !== undefined && parentW !== undefined) {
      edges.push({ x1: parentX + parentW, y1: parentY, x2: x, y2: yCenter, colorIdx })
    }

    if (node.children?.length) {
      let childRow = rowOffset
      node.children.forEach((child, i) => {
        const childColor = depth === 0 ? i % BRANCH_COLORS.length : colorIdx
        place(child, depth + 1, childRow, childColor, x, yCenter, w)
        childRow += countLeaves(child) * ROW_H
      })
    }
  }

  place(root, 0, 0, -1)

  return { nodes, edges, canvasW, canvasH }
}

// ── Visual mindmap SVG renderer ───────────────────────────────────────────────
function MindMapSVG({ root }: { root: MindMapNode }) {
  const { nodes, edges, canvasW, canvasH } = useMemo(() => buildLayout(root), [root])
  const [hovered, setHovered] = useState<{ label: string; insight?: string } | null>(null)
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 })

  const handleNodeEnter = (label: string, insight: string | undefined, e: React.MouseEvent) => {
    setHovered({ label, insight })
    setTipPos({ x: e.clientX, y: e.clientY })
  }
  const handleNodeMove = (e: React.MouseEvent) => setTipPos({ x: e.clientX, y: e.clientY })
  const handleNodeLeave = () => setHovered(null)

  return (
    <div
      className="w-full overflow-auto rounded-xl bg-muted/20 relative"
      style={{ maxHeight: '65vh' }}
    >
      {hovered && (
        <div
          className="fixed z-50 max-w-xs rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg text-left pointer-events-none"
          style={{ left: tipPos.x + 12, top: tipPos.y + 12 }}
          role="tooltip"
        >
          <p className="font-semibold text-sm text-foreground">{hovered.label}</p>
          {hovered.insight && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{hovered.insight}</p>
          )}
        </div>
      )}
      <svg
        width={canvasW}
        height={canvasH}
        style={{ display: 'block', minWidth: Math.min(canvasW, 640) }}
        aria-label="Course concept mindmap"
        role="img"
      >
        {/* ── Edges (drawn first so they sit behind nodes) ── */}
        {edges.map((e, i) => {
          const c = e.colorIdx < 0 ? '#94A3B8' : BRANCH_COLORS[e.colorIdx % BRANCH_COLORS.length].line
          const cx = (e.x1 + e.x2) / 2
          return (
            <path
              key={i}
              d={`M ${e.x1} ${e.y1} C ${cx} ${e.y1} ${cx} ${e.y2} ${e.x2} ${e.y2}`}
              stroke={c}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
              opacity={0.7}
            />
          )
        })}

        {/* ── Nodes ── */}
        {nodes.map((n) => {
          const dp = Math.min(n.depth, 3)
          const fpx = FONT_PX[dp]
          const isRoot = n.depth === 0
          const color = n.colorIdx >= 0 ? BRANCH_COLORS[n.colorIdx % BRANCH_COLORS.length] : null
          const hasTooltip = n.insight != null || n.label.length > 0
          const nodeHandlers = hasTooltip
            ? {
                onMouseEnter: (e: React.MouseEvent) => handleNodeEnter(n.label, n.insight, e),
                onMouseMove: handleNodeMove,
                onMouseLeave: handleNodeLeave,
              }
            : {}

          // Root → dark slate pill
          if (isRoot) {
            return (
              <g key={n.key} {...nodeHandlers} style={{ cursor: hasTooltip ? 'help' : 'default' }}>
                <rect
                  x={n.x} y={n.y - n.h / 2}
                  width={n.w} height={n.h}
                  rx={10}
                  fill="#0F172A"
                />
                <foreignObject x={n.x + 8} y={n.y - n.h / 2 + 5} width={n.w - 16} height={n.h - 10}>
                  <div
                    style={{
                      fontSize: fpx,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      lineHeight: 1.25,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      wordBreak: 'break-word',
                    }}
                  >
                    {n.label}
                  </div>
                </foreignObject>
              </g>
            )
          }

          // Depth 1 → solid colored pill, white text
          if (n.depth === 1 && color) {
            return (
              <g key={n.key} {...nodeHandlers} style={{ cursor: hasTooltip ? 'help' : 'default' }}>
                <rect
                  x={n.x} y={n.y - n.h / 2}
                  width={n.w} height={n.h}
                  rx={8}
                  fill={color.solid}
                />
                <foreignObject x={n.x + 8} y={n.y - n.h / 2 + 4} width={n.w - 16} height={n.h - 8}>
                  <div
                    style={{
                      fontSize: fpx,
                      fontWeight: 600,
                      color: '#FFFFFF',
                      lineHeight: 1.25,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      wordBreak: 'break-word',
                    }}
                  >
                    {n.label}
                  </div>
                </foreignObject>
              </g>
            )
          }

          // Depth 2 → bordered box, transparent fill, colored text
          if (n.depth === 2 && color) {
            return (
              <g key={n.key} {...nodeHandlers} style={{ cursor: hasTooltip ? 'help' : 'default' }}>
                <rect
                  x={n.x} y={n.y - n.h / 2}
                  width={n.w} height={n.h}
                  rx={6}
                  fill="transparent"
                  stroke={color.stroke}
                  strokeWidth={1.5}
                />
                <foreignObject x={n.x + 7} y={n.y - n.h / 2 + 4} width={n.w - 14} height={n.h - 8}>
                  <div
                    style={{
                      fontSize: fpx,
                      fontWeight: 500,
                      color: color.label,
                      lineHeight: 1.25,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      wordBreak: 'break-word',
                    }}
                  >
                    {n.label}
                  </div>
                </foreignObject>
              </g>
            )
          }

          // Depth 3+ → dot + label text, no box
          const dotColor = color ? color.stroke : '#94A3B8'
          const textColor = color ? color.label : '#64748B'
          return (
            <g key={n.key} {...nodeHandlers} style={{ cursor: hasTooltip ? 'help' : 'default' }}>
              <circle
                cx={n.x + 5}
                cy={n.y}
                r={3}
                fill={dotColor}
                opacity={0.8}
              />
              <foreignObject x={n.x + 13} y={n.y - n.h / 2 + 1} width={n.w - 13} height={n.h - 2}>
                <div
                  style={{
                    fontSize: fpx,
                    fontWeight: 400,
                    color: textColor,
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    wordBreak: 'break-word',
                  }}
                >
                  {n.label}
                </div>
              </foreignObject>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Scope switcher (reused in all states) ─────────────────────────────────────
function ScopeSwitcher({
  scope,
  onScopeChange,
}: {
  scope: 'module' | 'course'
  onScopeChange: (s: 'module' | 'course') => void
}) {
  return (
    <div
      role="group"
      aria-label="Mindmap scope"
      className="flex rounded-lg border border-border bg-muted/50 p-0.5 shrink-0"
    >
      {(['module', 'course'] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onScopeChange(s)}
          aria-pressed={scope === s}
          aria-label={s === 'module' ? 'Show this section' : 'Show whole course'}
          className={cn(
            'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
            scope === s
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {s === 'module' ? 'This section' : 'Whole course'}
        </button>
      ))}
    </div>
  )
}

// ── Public component ─────────────────────────────────────────────────────────
export function MindMapCard({
  scope,
  onScopeChange,
  root,
  loading,
  onRetry,
}: {
  scope: 'module' | 'course'
  onScopeChange: (scope: 'module' | 'course') => void
  root: MindMapNode | null
  loading?: boolean
  onRetry?: () => void
}) {
  // ── Loading ──
  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto py-12 flex flex-col items-center justify-center gap-4">
        <ScopeSwitcher scope={scope} onScopeChange={onScopeChange} />
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">
          {scope === 'course' ? 'Building your course mindmap…' : 'Sudar is building your mindmap…'}
        </p>
      </div>
    )
  }

  // ── Empty ──
  if (!root || (!root.label && (!root.children || root.children.length === 0))) {
    return (
      <div className="w-full max-w-6xl mx-auto py-12 flex flex-col items-center gap-4">
        <ScopeSwitcher scope={scope} onScopeChange={onScopeChange} />
        <Network className="w-10 h-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          {scope === 'course'
            ? 'No course mindmap could be generated.'
            : 'No mindmap could be generated for this section.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Try again
          </button>
        )}
      </div>
    )
  }

  // ── Mindmap ──
  return (
    <div className="w-full max-w-6xl mx-auto py-6">
      <div className="rounded-2xl border border-border bg-card">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5" /> SudarMind
          </span>
          <ScopeSwitcher scope={scope} onScopeChange={onScopeChange} />
        </div>

        {/* Visual mindmap canvas */}
        <div className="p-4">
          <MindMapSVG root={root} />
        </div>

        {/* Legend */}
        <div className="px-5 py-2.5 border-t border-border flex flex-wrap gap-x-4 gap-y-1.5">
          {(root.children ?? []).slice(0, 6).map((child, i) => {
            const c = BRANCH_COLORS[i % BRANCH_COLORS.length]
            return (
              <span key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ background: c.solid }}
                />
                {child.label}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

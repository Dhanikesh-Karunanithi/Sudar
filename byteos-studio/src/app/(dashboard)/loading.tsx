import { SudarLoadingStrip } from '@/components/branding/SudarBrandLoader'

export default function DashboardLoading() {
  return (
    <div className="p-8 space-y-6">
      <SudarLoadingStrip
        label="Loading…"
        className="text-slate-400"
        starFill="#020617"
        markClassName="text-violet-400"
      />
      <div className="space-y-4 max-w-3xl animate-pulse">
        <div className="h-9 w-48 bg-slate-800 rounded-lg" />
        <div className="h-32 w-full bg-slate-800/80 rounded-xl border border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-24 bg-slate-800/80 rounded-lg border border-slate-800" />
          <div className="h-24 bg-slate-800/80 rounded-lg border border-slate-800" />
        </div>
      </div>
    </div>
  )
}

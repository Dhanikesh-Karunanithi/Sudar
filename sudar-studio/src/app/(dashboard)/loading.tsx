import { SudarLoadingFrost } from '@/components/branding/SudarBrandLoader'
import { SudarLogoMark } from '@/components/branding/SudarLogo'

export default function DashboardLoading() {
  return (
    <div className="relative p-8 min-h-[min(64vh,520px)] overflow-hidden rounded-2xl space-y-6">
      <div className="pointer-events-none select-none opacity-[0.32] space-y-4 max-w-3xl animate-pulse">
        <div className="h-9 w-48 bg-slate-800 rounded-lg" />
        <div className="h-32 w-full bg-slate-800/80 rounded-xl border border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-24 bg-slate-800/80 rounded-lg border border-slate-800" />
          <div className="h-24 bg-slate-800/80 rounded-lg border border-slate-800" />
        </div>
      </div>
      <SudarLoadingFrost variant="fixed" label="Loading Studio…" className="rounded-none">
        <SudarLogoMark
          className="h-20 w-auto text-primary"
          starFill="var(--background)"
          motion="loading"
        />
      </SudarLoadingFrost>
    </div>
  )
}

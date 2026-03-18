import { BarChart2 } from 'lucide-react'

export default function ProgressLoading() {
  return (
    <div className="space-y-10 animate-pulse">
      <div>
        <div className="flex items-center gap-2">
          <BarChart2 className="w-7 h-7 text-muted-foreground" />
          <div className="h-8 w-44 bg-muted rounded-lg" />
        </div>
        <div className="h-4 w-80 bg-muted rounded mt-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="kpi-card !p-5 space-y-3">
              <div className="h-3 w-28 bg-muted rounded" />
              <div className="h-8 w-12 bg-muted rounded" />
            </div>
          ))}
        </div>
        <div className="kpi-card flex flex-col">
          <div className="h-6 w-40 bg-muted rounded mb-4" />
          <div className="flex-1 min-h-[220px] bg-muted rounded-xl" />
        </div>
      </div>

      {[0, 1].map((section) => (
        <section key={section} className="space-y-4">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="space-y-3">
            {[0, 1, 2].map((row) => (
              <div key={row} className="bg-card border border-border rounded-card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-card bg-muted shrink-0" />
                  <div className="min-w-0 space-y-2 flex-1">
                    <div className="h-4 w-2/3 bg-muted rounded" />
                    <div className="h-3 w-1/3 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-4 w-4 bg-muted rounded shrink-0" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}


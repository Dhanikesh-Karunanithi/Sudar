import { BookOpen, BarChart2, Route } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 animate-pulse">
      {/* Left column */}
      <div className="flex-[2.2] flex flex-col gap-8">
        {/* Hero */}
        <section className="hero-block min-h-[280px] flex flex-col justify-between p-6 md:p-10">
          <div className="space-y-3">
            <div className="h-10 md:h-12 lg:h-14 w-2/3 bg-muted rounded-lg" />
            <div className="h-5 w-3/5 bg-muted rounded-md" />
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <div className="h-6 w-28 bg-muted rounded-full" />
              <div className="h-6 w-32 bg-muted rounded-full" />
              <div className="h-6 w-40 bg-muted rounded-full" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <div className="h-10 w-64 bg-muted rounded-button" />
            <div className="h-10 w-40 bg-muted rounded-button" />
          </div>
        </section>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="kpi-card !p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-4 w-4 bg-muted rounded" />
              </div>
              <div className="h-7 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>

        {/* Activity + courses */}
        <div className="kpi-card min-h-[220px] flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <div className="h-5 w-24 bg-muted rounded" />
              <div className="h-3 w-28 bg-muted rounded" />
            </div>
          </div>
          <div className="h-[140px] w-full bg-muted rounded-xl" />
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <div className="h-3 w-24 bg-muted rounded" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-1/2 bg-muted rounded" />
                <div className="h-4 w-10 bg-muted rounded" />
                <div className="h-2 w-16 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Continue learning grid placeholder */}
        <div className="space-y-3">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="bg-card border border-border rounded-card p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-card bg-muted flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-full bg-muted rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-muted rounded" />
                  <div className="h-2 w-full bg-muted rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right column */}
      <aside className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="kpi-card !p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-muted-foreground" />
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-3 w-28 bg-muted rounded" />
              <div className="h-3 w-12 bg-muted rounded" />
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}


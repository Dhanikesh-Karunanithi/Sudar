import { ArrowLeft, BookOpen } from 'lucide-react'

export default function CourseDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 p-6">
      <div className="h-5 w-32 bg-muted rounded animate-pulse" />
      <div className="bg-primary/5 rounded-card-xl p-8 border border-primary/20 animate-pulse">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-card bg-muted shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="flex gap-3 pt-2">
              <div className="h-6 bg-muted rounded w-20" />
              <div className="h-6 bg-muted rounded w-24" />
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        <div className="bg-card border border-border rounded-card divide-y divide-border">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
              <div className="flex-1 h-4 bg-muted rounded w-2/3" />
              <div className="h-8 w-20 bg-muted rounded-button" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

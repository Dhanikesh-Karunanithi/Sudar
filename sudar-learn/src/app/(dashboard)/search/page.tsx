import Link from 'next/link'
import { Search, BookOpen, Route, ArrowRight } from 'lucide-react'
import { getCachedPublishedCourses, getCachedPublishedPaths } from '@/lib/cache'

type SearchPageProps = {
  searchParams?: { q?: string }
}

export default async function GlobalSearchPage({ searchParams }: SearchPageProps) {
  const query = (searchParams?.q ?? '').trim()
  const normalized = query.toLowerCase()

  const [courses, paths] = query
    ? await Promise.all([getCachedPublishedCourses(), getCachedPublishedPaths()])
    : [[], []]

  const filteredCourses = query
    ? courses
        .filter((course) => {
          const title = (course.title ?? '').toLowerCase()
          const description = (course.description ?? '').toLowerCase()
          const tags = Array.isArray(course.tags) ? course.tags.map((tag) => String(tag).toLowerCase()) : []
          return (
            title.includes(normalized) ||
            description.includes(normalized) ||
            tags.some((tag) => tag.includes(normalized))
          )
        })
        .slice(0, 20)
    : []

  const filteredPaths = query
    ? paths
        .filter((path) => {
          const title = (path.title ?? '').toLowerCase()
          const description = (path.description ?? '').toLowerCase()
          const courseTitles = Array.isArray(path.courses)
            ? path.courses.map((course) => String(course.title ?? '').toLowerCase())
            : []
          return (
            title.includes(normalized) ||
            description.includes(normalized) ||
            courseTitles.some((courseTitle) => courseTitle.includes(normalized))
          )
        })
        .slice(0, 20)
    : []

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-card-foreground">Search</h1>
        {!query ? (
          <p className="text-muted-foreground text-sm mt-1">
            Use the header search box to find courses and learning paths.
          </p>
        ) : (
          <p className="text-muted-foreground text-sm mt-1">
            Results for <span className="font-semibold text-card-foreground">&quot;{query}&quot;</span>
          </p>
        )}
      </div>

      <form action="/search" method="get" className="md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search courses or paths..."
            className="w-full h-10 pl-9 pr-3 rounded-button bg-card border border-border text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </form>

      {!query && (
        <div className="bg-card border border-border rounded-card p-8 text-center space-y-3">
          <Search className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Start typing in the top search box to see results.</p>
        </div>
      )}

      {query && filteredCourses.length === 0 && filteredPaths.length === 0 && (
        <div className="bg-card border border-border rounded-card p-8 text-center space-y-3">
          <Search className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No results found. Try a different keyword.</p>
        </div>
      )}

      {filteredCourses.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-card-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="bg-card border border-border rounded-card p-4 hover:border-primary/30 transition-colors"
              >
                <h3 className="text-sm font-semibold text-card-foreground">{course.title}</h3>
                {course.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                )}
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Open course
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {filteredPaths.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-card-foreground flex items-center gap-2">
            <Route className="w-4 h-4 text-primary" />
            Learning Paths
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredPaths.map((path) => (
              <Link
                key={path.id}
                href={`/paths/${path.id}`}
                className="bg-card border border-border rounded-card p-4 hover:border-primary/30 transition-colors"
              >
                <h3 className="text-sm font-semibold text-card-foreground">{path.title}</h3>
                {path.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{path.description}</p>
                )}
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Open path
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

# Sudar Learn — Performance & Improvement Audit

**Scope**: sudar-learn (Sudar Learn) — learner-facing Next.js 14 app.  
**Date**: March 2026.

This document summarizes opportunities to make the application **faster** and **more maintainable**, with clear priorities and implementation notes.

---

## Executive summary

- **Server/data**: Most impact comes from **reducing database round-trips** on the dashboard and **adding short-lived caching** for semi-static data. No caching is used today.
- **Frontend**: **Charts and animation libraries** are loaded eagerly; **dynamic imports** for route-specific or below-the-fold components would reduce initial JS and improve TTI/LCP.
- **APIs**: Tutor and next-action routes do **heavy work per request**; catalog and path limits can be tightened and some work deferred or cached.

---

## 1. Data fetching & server

### 1.1 Dashboard page — multiple round-trips (High impact)

**Current behavior**: The dashboard runs several sequential Supabase calls after the first `Promise.all`:

1. First batch: `profiles`, `learner_profiles`, `enrollments`, `learning_events` (200), `enrollmentsWithDue`.
2. Then: `courses` for enrolled course IDs (if any).
3. Then: `learning_paths` for path titles, `courses` again for course titles (deadlines).
4. Then: `enrollments` (path), `learning_paths` again (required paths).
5. If org: `profiles` (org), `learning_events` (org, this week), `profiles` again (names for leaderboard).

**Opportunity**:
- **Combine** all “title lookups” (courses, paths) into one or two batched queries where possible (e.g. one `courses` select with all needed IDs, one `learning_paths` with all needed IDs).
- **Reduce** `learning_events` limit from 200 to what’s needed for dashboard stats (e.g. last 30 days or last 100 events). Today the full 200 is used only for streak, activity chart, and period stats.
- **Consider** moving leaderboard to a client fetch or a separate route so the main dashboard HTML doesn’t wait for it.

**Files**: `sudar-learn/src/app/(dashboard)/page.tsx`

---

### 1.2 No data caching (High impact)

**Current behavior**: Every request hits Supabase with no `unstable_cache`, `cache()`, or `revalidate`.

**Opportunity**:
- Use **`unstable_cache`** (or React `cache()` where appropriate) for:
  - **Course catalog** (published courses list): e.g. 60–300s TTL.
  - **Learning paths list**: e.g. 60–300s TTL.
  - **Learner profile / next_best_action**: short TTL (e.g. 30–60s) to avoid stale “Sudar recommends” while cutting repeated reads.
- Use **`revalidate`** on list pages (e.g. courses, paths) if you want time-based revalidation instead of on-demand.

**Files**: All server components and API routes that read courses, paths, or learner profile.

---

### 1.3 Next Best Action — fire-and-forget + heavy work (Medium impact)

**Current behavior**: Dashboard does a non-blocking `fetch` to `/api/intelligence/next-action`. The route:
- Loads all published courses and enrollments.
- Scores every unenrolled course.
- Optionally calls Together AI for a reason string.
- Writes `next_best_action` to `learner_profiles`.

**Opportunity**:
- **Already good**: Request doesn’t block dashboard render.
- **Improve route**: Skip loading full course list when `existing.next_best_action` is fresh (already done). Ensure “skip when fresh” is the first DB read so you don’t do unnecessary work.
- **Optional**: Move next-action computation to a **background job** (e.g. after module_complete) and have dashboard only read `next_best_action`; then you can remove the fire-and-forget fetch from the dashboard.

**Files**: `sudar-learn/src/app/(dashboard)/page.tsx` (fetch), `sudar-learn/src/app/api/intelligence/next-action/route.ts`

---

### 1.4 Tutor API — large context and extra calls (Medium impact)

**Current behavior**:
- With **no** `course_id` (e.g. floating chat): loads up to **50 courses** and **200 learning paths** for platform context, plus all enrollments.
- With `course_id`: loads **full course + all modules’ content** (capped at 6000 chars in prompt).
- **Input guardrail**: Extra LLM call (Together) for every user message.
- **Memory update**: Second LLM call in `updateLearnerMemory` (fire-and-forget).

**Opportunity**:
- **Reduce limits**: e.g. `PLATFORM_CONTEXT_CATALOG_LIMIT` from 50 to 20–30; learning paths from 200 to 50–100.
- **Narrow path query**: Select only `id` (and maybe `title`) if that’s all used in context.
- **Guardrail**: Consider a **short-lived cache** keyed by hashed message for identical questions to avoid repeated LLM calls (optional, watch for PII).
- **Course context**: When `course_id` is set, you already truncate; ensure modules are ordered and truncated so the first N modules (or current ±1) get priority to keep token count predictable.

**Files**: `sudar-learn/src/app/api/tutor/query/route.ts`

---

### 1.5 Paths page — select * (Low–Medium impact)

**Current behavior**: `admin.from('learning_paths').select('*')` loads every column.

**Opportunity**: Select only needed fields (e.g. `id`, `title`, `description`, `courses`, `is_mandatory`, `status`, `issues_certificate`, `is_adaptive`) to reduce payload and align with principle of least data.

**Files**: `sudar-learn/src/app/(dashboard)/paths/page.tsx`

---

### 1.6 Memory page — events limit 200 (Low impact)

**Current behavior**: Fetches last 200 `learning_events` for insights.

**Opportunity**: If insights only need recent activity, reduce limit (e.g. 100) or add a date filter (e.g. last 90 days) to avoid scanning unnecessary rows as data grows.

**Files**: `sudar-learn/src/app/(dashboard)/memory/page.tsx`, `sudar-learn/src/lib/memory/insights.ts`

---

### 1.7 Course learn page — full course in one shot (Medium impact for large courses)

**Current behavior**: Server loads **full course** with **all modules** (id, title, content, modality_variants, order_index, quiz) and passes to `CourseViewer`. Client has everything up front.

**Opportunity**:
- **Short term**: Ensure module `content` is only selected when needed; if Supabase supports, avoid loading heavy `content` for modules that aren’t the active one (harder with current Prisma/Supabase shape).
- **Long term**: Consider **per-module loading**: initial load only active module (and maybe prev/next); load other modules on demand when user navigates. This would require an API or server component that returns one module by ID.

**Files**: `sudar-learn/src/app/(dashboard)/courses/[id]/learn/page.tsx`, `CourseViewer.tsx`

---

## 2. Frontend & bundle

### 2.1 Recharts loaded on every dashboard/progress visit (High impact)

**Current behavior**: `ActivityChart` (dashboard) and `ProgressPieChart` (progress page) import recharts directly. Recharts is included in the JS bundle for those routes.

**Opportunity**:
- **Dynamic import** the chart components so recharts is in a separate chunk and only loaded when the user hits dashboard or progress:
  - e.g. `const ActivityChart = dynamic(() => import('@/components/dashboard/ActivityChart').then(m => m.ActivityChart), { ssr: false })` (use `ssr: false` only if you don’t need charts in SSR).
- If you need charts in SSR, keep the import but ensure they’re only used on the routes that need them (no recharts in layout).

**Files**: `sudar-learn/src/app/(dashboard)/page.tsx`, `sudar-learn/src/app/(dashboard)/progress/page.tsx`, `sudar-learn/src/components/dashboard/ActivityChart.tsx`, `sudar-learn/src/components/progress/ProgressPieChart.tsx`

---

### 2.2 Framer Motion used in many components (Medium impact)

**Current behavior**: Framer Motion is used in layout (e.g. `PageTransition`), TopNav, FloatingSudarChat, and several learn blocks (Flashcard, Timeline, Tabs, Flipcard). All are static imports, so the library is in the main client bundle for the dashboard.

**Opportunity**:
- **Route-level dynamic import** for heavy, route-specific components (e.g. course learn blocks or FloatingSudarChat) so motion is not required on first load of dashboard.
- **Lighter alternatives** for simple enter/exit or hover (e.g. CSS transitions or a small utility) where you don’t need full Framer Motion features.
- Keep Framer Motion for complex animations (e.g. course viewer, chat panel) but load those routes/chunks on demand.

**Files**: All components that `import { motion, AnimatePresence } from 'framer-motion'`

---

### 2.3 FloatingSudarChat in layout (Medium impact)

**Current behavior**: `FloatingSudarChat` is rendered in the dashboard layout for every dashboard page. It’s a client component with Framer Motion and chat UI.

**Opportunity**:
- **Lazy load** the floating chat: e.g. `const FloatingSudarChat = dynamic(() => import('@/components/tutor/FloatingSudarChat').then(m => m.FloatingSudarChat), { ssr: false })` in the layout so the chat (and its dependencies) load after the main content.
- Ensures users who don’t open the chat don’t pay the cost of its bundle on first load.

**Files**: `sudar-learn/src/app/(dashboard)/layout.tsx`, `sudar-learn/src/components/tutor/FloatingSudarChat.tsx`

---

### 2.4 Image optimization (Low impact)

**Current behavior**: FloatingSudarChat uses `<Image … unoptimized />` for the Sudar chat logo.

**Opportunity**: Pre-optimize the logo (e.g. WebP, correct size) and use Next.js Image **without** `unoptimized` so the image is optimized and responsive. Use `unoptimized` only if the image is external or you have a specific reason.

**Files**: `sudar-learn/src/components/tutor/FloatingSudarChat.tsx`

---

## 3. Next.js & build

### 3.1 next.config.mjs empty (Low–Medium impact)

**Current behavior**: No custom config.

**Opportunity**:
- **Bundle analyzer**: Add `@next/bundle-analyzer` in development to see what’s in each chunk and validate that dynamic imports split recharts/framer-motion as intended.
- **Images**: If you use external image domains later, configure `images.domains`.
- **Experimental**: Consider `optimizePackageImports` (e.g. for `lucide-react`) to tree-shake icons. Example:
  ```js
  experimental: { optimizePackageImports: ['lucide-react'] }
  ```

**Files**: `sudar-learn/next.config.mjs`

---

## 4. Summary table

| Area              | Opportunity                          | Impact   | Effort  |
|-------------------|--------------------------------------|----------|---------|
| Data fetching     | Batch dashboard queries; reduce events limit | High     | Medium  |
| Caching           | Add unstable_cache for catalog, paths, profile | High     | Low–Med |
| Tutor API         | Lower catalog/path limits; optional guardrail cache | Medium   | Low     |
| Paths page        | Select only needed columns           | Low–Med  | Low     |
| Course learn      | Per-module loading (long term)       | Medium   | High    |
| Recharts          | Dynamic import chart components      | High     | Low     |
| Framer Motion     | Dynamic import / lighter alternatives| Medium   | Medium  |
| FloatingSudarChat| Dynamic import in layout             | Medium   | Low     |
| Images            | Remove unoptimized; use Next Image    | Low      | Low     |
| next.config       | Bundle analyzer; optimizePackageImports | Low–Med | Low     |

---

## 5. Recommended order of work

1. **Quick wins**: Paths `select` only needed columns; reduce `learning_events` limit on dashboard/memory; lower tutor catalog/path limits.
2. **Caching**: Add `unstable_cache` (or equivalent) for course catalog and learning paths with a short TTL; optionally for learner profile/next_best_action.
3. **Dashboard**: Combine title lookups into fewer queries; consider moving leaderboard to client or separate request.
4. **Bundle**: Dynamic import ActivityChart and ProgressPieChart; dynamic import FloatingSudarChat in dashboard layout.
5. **Larger**: Per-module loading for course learn; optional background job for next-action; Framer Motion reduction/dynamic loading where it matters most.

---

*Sudar — Learns with you, for you.*

import { SudarLoadingFrost } from '@/components/branding/SudarBrandLoader'

/** Full-viewport loader — avoids the narrow dashboard card while SCORM/course viewer hydrates. */
export default function CourseLearnLoading() {
  return (
    <div className="fixed inset-0 z-[40] flex items-center justify-center bg-background">
      <SudarLoadingFrost label="Loading course…" className="rounded-2xl" />
    </div>
  )
}

import { redirect } from 'next/navigation'

export default async function LegacyModuleSimPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>
}) {
  const { id: courseId } = await params
  redirect(`/courses/${courseId}`)
}

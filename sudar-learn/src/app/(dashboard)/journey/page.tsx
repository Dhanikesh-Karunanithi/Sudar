import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isJourneyEnabled } from '@/lib/journey/isJourneyEnabled'
import { JourneyWorkspace } from '@/components/journey/JourneyWorkspace'

export const metadata = {
  title: 'SudarNotes · Sudar Learn',
  description: 'Conversational personal tutoring with a living notebook you own.',
}

export default async function JourneyPage() {
  if (!isJourneyEnabled()) {
    redirect('/')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <JourneyWorkspace userId={user.id} />
}

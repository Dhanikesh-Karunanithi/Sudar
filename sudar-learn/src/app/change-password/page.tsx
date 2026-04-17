import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChangePasswordForm } from './ChangePasswordForm'

export default async function ChangePasswordPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('require_password_change')
    .eq('id', user.id)
    .single()

  if (!profile?.require_password_change) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-shell flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-lg">
        <h1 className="text-xl font-semibold text-foreground mb-1">Change your password</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Your password was reset. Please set a new password to continue.
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  )
}

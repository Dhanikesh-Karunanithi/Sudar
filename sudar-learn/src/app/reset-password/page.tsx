import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChangePasswordForm } from '../change-password/ChangePasswordForm'

export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?error=reset_link_expired')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] p-6">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-8 backdrop-blur-sm">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-xl font-semibold text-white">Set a new password</h1>
          <p className="text-sm text-zinc-500">Choose a new password for {user.email}.</p>
        </div>
        <ChangePasswordForm recovery />
        <p className="text-center text-sm text-zinc-500">
          <Link href="/login" className="font-medium text-[#FF4500]/90 transition-colors hover:text-[#FF5722]">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

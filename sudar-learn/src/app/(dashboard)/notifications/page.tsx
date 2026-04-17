import { NotificationsClient } from './NotificationsClient'

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-card-foreground md:text-3xl">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Updates from your learning activity across Sudar.
        </p>
      </div>
      <NotificationsClient />
    </div>
  )
}

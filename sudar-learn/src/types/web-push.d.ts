declare module 'web-push' {
  type PushSubscriptionLike = {
    endpoint?: string
    keys?: {
      p256dh?: string
      auth?: string
    }
  }

  const webpush: {
    setVapidDetails(subject: string, publicKey: string, privateKey: string): void
    sendNotification(subscription: PushSubscriptionLike, payload?: string): Promise<unknown>
  }

  export default webpush
}

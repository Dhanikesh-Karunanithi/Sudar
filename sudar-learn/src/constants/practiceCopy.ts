export const PRACTICE_COPY = {
  title: 'Practice',
  subtitle:
    'Rehearse real conversations with an AI customer, then get coaching from Sudar. Results count toward what you have mastered.',
  start: 'Start practice',
  starting: 'Starting…',
  startError: "Couldn't start this practice. Please try again.",
  emptyTitle: 'No practice scenarios yet',
  emptyBody:
    'When your organisation publishes a practice scenario it will appear here. Some courses also include practice inside a module.',
  channels: { phone: 'Voice call', chat: 'Chat', email: 'Email' } as Record<string, string>,
} as const

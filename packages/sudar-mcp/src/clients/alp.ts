/**
 * Minimal ALP HTTP client (mirrors integrations/alp-sdk).
 */
export type AlpEvent = {
  event_type: string
  course_id?: string
  module_id?: string
  payload?: unknown
  modality?: string
  duration_secs?: number
}

export class AlpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-alp-api-key': this.apiKey,
    }
  }

  private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    })
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    if (!res.ok) {
      throw new Error(data.error || `ALP ${path} failed: ${res.status}`)
    }
    return data as T
  }

  ingestEvents(body: { user_id: string; events: AlpEvent[] }) {
    return this.post<{ ok: boolean; inserted: number }>('/api/alp/events', body)
  }

  tutorQuery(body: {
    user_id: string
    message: string
    context_text?: string
    course_id?: string
    module_id?: string
  }) {
    return this.post<Record<string, unknown>>('/api/alp/tutor/query', body)
  }

  nextAction(body: { user_id: string; current_enrollment_ids?: string[] }) {
    return this.post<Record<string, unknown>>('/api/alp/next-action', body)
  }

  resolveIdentity(body: { provider?: string; external_user_id: string }) {
    return this.post<{ sudar_user_id: string; provider?: string }>('/api/alp/identity/resolve', body)
  }

  embedToken(body: { user_id: string; course_id?: string; module_id?: string }) {
    return this.post<{ token: string; embed_url: string; expires_in: number }>('/api/alp/embed-token', body)
  }

  createQuiz(body: Record<string, unknown>) {
    return this.post<Record<string, unknown>>('/api/alp/create/quiz', body)
  }

  createInteractive(body: Record<string, unknown>) {
    return this.post<Record<string, unknown>>('/api/alp/create/interactive', body)
  }

  createFlashcards(body: Record<string, unknown>) {
    return this.post<Record<string, unknown>>('/api/alp/create/flashcards', body)
  }

  createOutline(body: Record<string, unknown>) {
    return this.post<Record<string, unknown>>('/api/alp/create/outline', body)
  }

  createFromDocument(body: Record<string, unknown>) {
    return this.post<Record<string, unknown>>('/api/alp/create/from-document', body)
  }

  createEmbedToken(body: { creator_user_id: string; tool?: string }) {
    return this.post<Record<string, unknown>>('/api/alp/create/embed-token', body)
  }
}

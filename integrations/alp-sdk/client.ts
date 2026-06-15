import type {
  AlpAuth,
  AlpEmbedTokenRequest,
  AlpEmbedTokenResponse,
  AlpEventsRequest,
  AlpIdentityResolveRequest,
  AlpIdentityResolveResponse,
  AlpNextActionRequest,
  AlpTutorRequest,
} from './types'

type JsonObject = Record<string, unknown>

export class AlpClient {
  private readonly baseUrl: string
  private readonly auth: AlpAuth

  constructor(baseUrl: string, auth: AlpAuth) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.auth = auth
  }

  private authHeaders(): Record<string, string> {
    if (this.auth.kind === 'apiKey') {
      return { 'x-alp-api-key': this.auth.value }
    }
    return { Authorization: `Bearer ${this.auth.value}` }
  }

  private async post<T>(path: string, body: JsonObject): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeaders(),
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorBody = (await res.json().catch(() => ({}))) as { error?: string }
      const msg = errorBody.error || `ALP call failed: ${res.status}`
      throw new Error(msg)
    }

    return (await res.json()) as T
  }

  ingestEvents(body: AlpEventsRequest): Promise<{ ok: boolean; inserted: number }> {
    return this.post('/api/alp/events', body as JsonObject)
  }

  tutorQuery<TResponse extends JsonObject = JsonObject>(body: AlpTutorRequest): Promise<TResponse> {
    return this.post('/api/alp/tutor/query', body as JsonObject)
  }

  nextAction<TResponse extends JsonObject = JsonObject>(body: AlpNextActionRequest): Promise<TResponse> {
    return this.post('/api/alp/next-action', body as JsonObject)
  }

  embedToken(body: AlpEmbedTokenRequest): Promise<AlpEmbedTokenResponse> {
    return this.post('/api/alp/embed-token', body as JsonObject)
  }

  resolveIdentity(body: AlpIdentityResolveRequest): Promise<AlpIdentityResolveResponse> {
    return this.post('/api/alp/identity/resolve', body as JsonObject)
  }

  createQuiz(body: JsonObject): Promise<JsonObject> {
    return this.post('/api/alp/create/quiz', body)
  }

  createInteractive(body: JsonObject): Promise<JsonObject> {
    return this.post('/api/alp/create/interactive', body)
  }

  createFlashcards(body: JsonObject): Promise<JsonObject> {
    return this.post('/api/alp/create/flashcards', body)
  }

  createOutline(body: JsonObject): Promise<JsonObject> {
    return this.post('/api/alp/create/outline', body)
  }

  createEmbedToken(body: { creator_user_id: string; tool?: string }): Promise<JsonObject> {
    return this.post('/api/alp/create/embed-token', body as JsonObject)
  }

  simEmbedToken(body: {
    user_id: string
    mode?: 'author' | 'play'
    scenario_id?: string | null
  }): Promise<JsonObject> {
    return this.post('/api/alp/sim/embed-token', body as JsonObject)
  }
}

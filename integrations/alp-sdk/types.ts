export type AlpAuth =
  | { kind: 'apiKey'; value: string }
  | { kind: 'bearer'; value: string }

export type AlpEvent = {
  event_type: string
  course_id?: string
  module_id?: string
  payload?: unknown
  modality?: string
  duration_secs?: number
}

export type AlpEventsRequest = {
  user_id: string
  events: AlpEvent[]
}

export type AlpTutorRequest = {
  user_id?: string
  message: string
  context_text?: string
  course_id?: string
  module_id?: string
}

export type AlpNextActionRequest = {
  user_id?: string
}

export type AlpEmbedTokenRequest = {
  user_id: string
  course_id?: string
  module_id?: string
}

export type AlpEmbedTokenResponse = {
  token: string
  embed_url: string
  expires_in: number
}

export type AlpIdentityResolveRequest = {
  provider?: string
  external_user_id: string
}

export type AlpIdentityResolveResponse = {
  sudar_user_id: string
  provider?: string
}

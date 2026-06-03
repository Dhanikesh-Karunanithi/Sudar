import type { MascotEmotion } from '@/types/mascot'

export type SudarPetState =
  | 'idle'
  | 'run_right'
  | 'run_left'
  | 'waving'
  | 'jumping'
  | 'failed'
  | 'waiting'
  | 'running'
  | 'review'

export interface SudarPetManifest {
  id: string
  sheetSrc: string
  placeholderSrc: string
  frameWidth: number
  frameHeight: number
  fps: number
  anchor: { x: number; y: number }
  states: Record<SudarPetState, { row: number; frames: number; fps?: number }>
}

export const DEFAULT_SUDAR_PET_MANIFEST: SudarPetManifest = {
  id: 'sudar_fire_core_v1',
  sheetSrc: '/sudar/pet/sudar-fire-core-sheet.png',
  placeholderSrc: '/sudar-logo.svg',
  frameWidth: 96,
  frameHeight: 96,
  fps: 10,
  anchor: { x: 0.5, y: 0.9 },
  states: {
    idle: { row: 0, frames: 6, fps: 8 },
    run_right: { row: 1, frames: 8, fps: 12 },
    run_left: { row: 2, frames: 8, fps: 12 },
    waving: { row: 3, frames: 4, fps: 8 },
    jumping: { row: 4, frames: 5, fps: 10 },
    failed: { row: 5, frames: 8, fps: 10 },
    waiting: { row: 6, frames: 6, fps: 8 },
    running: { row: 7, frames: 6, fps: 12 },
    review: { row: 8, frames: 6, fps: 8 },
  },
}

export const EMOTION_TO_PET_STATE: Partial<Record<MascotEmotion, SudarPetState>> = {
  neutral: 'idle',
  guiding: 'review',
  supportive: 'waving',
  celebratory: 'waving',
  concern: 'failed',
  focused: 'running',
  prompting: 'waiting',
  stabilizing: 'idle',
}

export const CHAT_OPEN_PET_EVENT = 'sudar:chat-open'

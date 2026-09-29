import type { SimPersonaState } from '@/types/sudarsim'

const DEFAULT: SimPersonaState = { mood: 0.5, difficulty: 0.5, trust: 0.5 }

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0.5
  return Math.min(1, Math.max(0, n))
}

/** Starting persona state for in-Studio preview (matches Learn seed logic). */
export function initialPersonaStateFromScenario(scenario: {
  persona?: unknown
  persona_state_rules?: unknown
}): SimPersonaState {
  const rules = scenario.persona_state_rules as
    | { initial_state?: Partial<SimPersonaState> }
    | null
    | undefined
  const initial = rules?.initial_state
  const persona = scenario.persona as { initial_mood?: number } | null | undefined
  const mood =
    typeof initial?.mood === 'number'
      ? initial.mood
      : typeof persona?.initial_mood === 'number'
        ? persona.initial_mood
        : DEFAULT.mood
  return {
    mood: clamp01(mood),
    trust: clamp01(typeof initial?.trust === 'number' ? initial.trust : DEFAULT.trust),
    difficulty: clamp01(typeof initial?.difficulty === 'number' ? initial.difficulty : DEFAULT.difficulty),
  }
}

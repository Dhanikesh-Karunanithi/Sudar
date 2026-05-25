/** Autoplay speed multiplier (1.5 = 50% faster). */
export const CINEMATIC_PLAYBACK_RATE = 1.5;

export function effectiveFrameDurationMs(durationMs: number): number {
  return Math.round(durationMs / CINEMATIC_PLAYBACK_RATE);
}

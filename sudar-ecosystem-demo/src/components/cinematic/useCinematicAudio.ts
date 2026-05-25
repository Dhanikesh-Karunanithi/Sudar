"use client";

import { useEffect, useRef } from "react";
import type { AudioCue } from "@/lib/cinematicAudio";
import { playCue, startAmbient, stopAmbient } from "@/lib/cinematicAudio";

export function useCinematicAudio(
  frameIndex: number,
  cue: AudioCue | undefined,
  playing: boolean,
  soundEnabled: boolean
) {
  const prevIndex = useRef(-1);
  const startedAmbient = useRef(false);

  useEffect(() => {
    if (!soundEnabled) {
      stopAmbient();
      startedAmbient.current = false;
      return;
    }

    if (playing && !startedAmbient.current) {
      startAmbient(0.8);
      startedAmbient.current = true;
    }
    if (!playing) {
      stopAmbient();
      startedAmbient.current = false;
    }
  }, [playing, soundEnabled]);

  useEffect(() => {
    if (!soundEnabled || frameIndex === prevIndex.current) return;
    prevIndex.current = frameIndex;
    if (cue) playCue(cue, 0.85);
  }, [frameIndex, cue, soundEnabled]);

  useEffect(() => () => stopAmbient(), []);
}

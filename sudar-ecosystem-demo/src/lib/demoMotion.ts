"use client";

import { useEffect, useState } from "react";
import { CINEMATIC_PLAYBACK_RATE } from "@/lib/cinematicPlayback";

/** Character-by-character typing for cinematic prompts */
export function useTypingText(
  fullText: string,
  active: boolean,
  msPerChar = 22 / CINEMATIC_PLAYBACK_RATE
) {
  const [text, setText] = useState(active ? "" : fullText);

  useEffect(() => {
    if (!active) {
      setText(fullText);
      return;
    }
    setText("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(id);
    }, msPerChar);
    return () => clearInterval(id);
  }, [fullText, active]);

  return text;
}

/** Count up to target integer on mount */
export function useCountUp(
  target: number,
  durationMs = 900 / CINEMATIC_PLAYBACK_RATE,
  active = true
) {
  const [value, setValue] = useState(active ? 0 : target);

  useEffect(() => {
    if (!active) {
      setValue(target);
      return;
    }
    setValue(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, active]);

  return value;
}

/** Animate playhead from startPct toward endPct */
export function useAnimatedProgress(
  endPct: number,
  active: boolean,
  startPct = Math.max(0, endPct - 20),
  durationMs = 2400 / CINEMATIC_PLAYBACK_RATE
) {
  const [pct, setPct] = useState(active ? startPct : endPct);

  useEffect(() => {
    if (!active) {
      setPct(endPct);
      return;
    }
    setPct(startPct);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 2;
      setPct(Math.round(startPct + (endPct - startPct) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [endPct, startPct, durationMs, active]);

  return pct;
}

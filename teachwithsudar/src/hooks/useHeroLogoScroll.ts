"use client";

import { useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

/** Pixels scrolled before the hero logo settles in the nav slot. */
export const HERO_LOGO_SCROLL_RANGE = 180;

/** On the home hero, delay compact nav styling until after the logo travel finishes. */
export const HERO_NAV_COMPACT_THRESHOLD = 240;

export function useHeroLogoScroll(enabled: boolean) {
  const reducedMotion = useReducedMotion() ?? false;
  const active = enabled && !reducedMotion;
  const { scrollY } = useScroll();
  const progress = useTransform(
    scrollY,
    [0, HERO_LOGO_SCROLL_RANGE],
    [0, 1],
    { clamp: true }
  );
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!active) {
      setSettled(false);
      return;
    }

    const update = () => {
      setSettled(window.scrollY >= HERO_LOGO_SCROLL_RANGE - 1);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [active]);

  return { active, progress, settled, scrollY };
}

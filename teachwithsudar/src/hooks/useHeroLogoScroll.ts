"use client";

import { useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { getLenis, getScrollY } from "@/lib/gsap-lenis";

/** Pixels scrolled before the hero logo settles in the nav slot. */
export const HERO_LOGO_SCROLL_RANGE = 180;

/** On the home hero, delay compact nav styling until after the logo travel finishes. */
export const HERO_NAV_COMPACT_THRESHOLD = 240;

export function useHeroLogoScroll(enabled: boolean) {
  const reducedMotion = useReducedMotion() ?? false;
  const active = enabled && !reducedMotion;
  const scrollY = useMotionValue(0);
  const progress = useTransform(
    scrollY,
    [0, HERO_LOGO_SCROLL_RANGE],
    [0, 1],
    { clamp: true }
  );
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!active) {
      scrollY.set(0);
      setSettled(false);
      return;
    }

    let raf = 0;
    const update = () => {
      const y = getScrollY();
      scrollY.set(y);
      setSettled(y >= HERO_LOGO_SCROLL_RANGE - 1);
    };

    update();

    const lenis = getLenis();
    const unsubscribeLenis = lenis?.on("scroll", update);
    window.addEventListener("scroll", update, { passive: true });

    const tick = () => {
      update();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      unsubscribeLenis?.();
      window.removeEventListener("scroll", update);
    };
  }, [active, scrollY]);

  return { active, progress, settled, scrollY };
}

"use client";

import {
  motion,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { SudarLogoAnimatedMark } from "@/components/gateway/SudarLogoAnimatedMark";
import { getLenis, getScrollY } from "@/lib/gsap-lenis";
import { useHeroLogoScroll } from "@/hooks/useHeroLogoScroll";

type LogoBounds = {
  startCenterX: number;
  startCenterY: number;
  endX: number;
  endY: number;
  endScale: number;
};

/**
 * Same scroll-flight mechanics as teachwithsudar.com HeroScrollLogo:
 * hero center → nav slot, scrubbed to scroll. Gateway uses the animated S mark.
 */
export function HeroScrollAnimatedLogo() {
  const { active, progress, settled } = useHeroLogoScroll(true);
  const floatingRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<LogoBounds | null>(null);
  const [ready, setReady] = useState(false);

  const centerX = useTransform(progress, (value) => {
    const bounds = boundsRef.current;
    if (!bounds) return 0;
    return bounds.startCenterX + (bounds.endX - bounds.startCenterX) * value;
  });

  const centerY = useTransform(progress, (value) => {
    const bounds = boundsRef.current;
    if (!bounds) return 0;
    return bounds.startCenterY + (bounds.endY - bounds.startCenterY) * value;
  });

  /** -50% at hero (centered) → 0% at nav (top-left), matching HeroScrollLogo. */
  const offsetX = useTransform(progress, (value) => `${-50 + 50 * value}%`);
  const offsetY = useTransform(progress, (value) => `${-50 + 50 * value}%`);

  const opacity = useTransform(progress, [0, 0.04, 0.98, 1], [0, 1, 1, 0]);

  const scale = useTransform(progress, (value) => {
    const bounds = boundsRef.current;
    if (!bounds) return 1;
    return 1 + (bounds.endScale - 1) * value;
  });

  const measure = useCallback(() => {
    const anchor = document.getElementById("hero-logo-anchor");
    const navLogo = document.getElementById("nav-logo-anchor");
    const floating = floatingRef.current;

    if (!anchor || !navLogo || !floating) return;

    const anchorRect = anchor.getBoundingClientRect();
    const navRect = navLogo.getBoundingClientRect();
    const floatingRect = floating.getBoundingClientRect();
    const previous = boundsRef.current;
    const scrollOffset = getScrollY();

    const startCenterX = anchorRect.left + anchorRect.width / 2;
    const startCenterY = anchorRect.top + anchorRect.height / 2;

    const widthForScale =
      anchorRect.width > 1 ? anchorRect.width : floatingRect.width;
    const endScale =
      navRect.height > 0 && widthForScale > 0
        ? navRect.height / widthForScale
        : 0.08;

    boundsRef.current = {
      startCenterX:
        previous && scrollOffset > 2 ? previous.startCenterX : startCenterX,
      startCenterY:
        previous && scrollOffset > 2 ? previous.startCenterY : startCenterY,
      endX: navRect.left,
      endY: navRect.top,
      endScale,
    };

    setReady(true);
  }, []);

  useLayoutEffect(() => {
    if (!active) {
      setReady(false);
      boundsRef.current = null;
      return;
    }

    measure();

    let raf = 0;
    const onResize = () => {
      if (getScrollY() <= 2) {
        boundsRef.current = null;
      }
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, { passive: true });

    const lenis = getLenis();
    const unsubscribeLenis = lenis?.on("scroll", onResize);

    return () => {
      cancelAnimationFrame(raf);
      unsubscribeLenis?.();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
    };
  }, [active, measure]);

  useMotionValueEvent(progress, "change", () => {
    if (!active) return;
    measure();
  });

  if (!active) return null;

  return (
    <motion.div
      className="pointer-events-none fixed z-[60] will-change-transform"
      style={{
        left: centerX,
        top: centerY,
        x: offsetX,
        y: offsetY,
        scale,
        opacity: settled ? 0 : opacity,
        visibility: ready ? "visible" : "hidden",
      }}
      aria-hidden={settled}
    >
      <div ref={floatingRef} className="sudar-logo-scroll-clone">
        <SudarLogoAnimatedMark sceneClass="is-holding" restingGlow={false} />
      </div>
    </motion.div>
  );
}

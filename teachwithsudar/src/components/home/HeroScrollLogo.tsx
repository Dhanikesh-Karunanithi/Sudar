"use client";

import Link from "next/link";
import { forwardRef } from "react";
import {
  motion,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { SudarLogoMark } from "@/components/brand/SudarLogoMark";
import { useHeroLogoScroll } from "@/hooks/useHeroLogoScroll";

/** Hero resting size relative to the nav logo (2×). */
const HERO_LOGO_START_SCALE = 2;

type LogoBounds = {
  startCenterX: number;
  startCenterY: number;
  endX: number;
  endY: number;
};

const SudarLogoLink = forwardRef<
  HTMLAnchorElement,
  { className?: string; id?: string; style?: React.CSSProperties }
>(function SudarLogoLink({ className, id, style }, ref) {
  return (
    <Link
      ref={ref}
      id={id}
      href="/"
      className={className}
      style={style}
      aria-label="Sudar home"
    >
      <span className="inline-flex shrink-0" aria-hidden="true">
        <SudarLogoMark size={36} variant="on-dark" />
      </span>
      Sudar.
    </Link>
  );
});

export function HeroScrollLogo() {
  const { active, progress, settled } = useHeroLogoScroll(true);
  const logoRef = useRef<HTMLAnchorElement>(null);
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

  /** -50% at hero (true center) → 0% at nav (top-left slot). */
  const offsetX = useTransform(progress, (value) => `${-50 + 50 * value}%`);
  const offsetY = useTransform(progress, (value) => `${-50 + 50 * value}%`);

  const opacity = useTransform(progress, [0, 0.98, 1], [1, 1, 0]);
  const scale = useTransform(progress, [0, 1], [HERO_LOGO_START_SCALE, 1]);

  const measure = useCallback(() => {
    const anchor = document.getElementById("hero-logo-anchor");
    const navLogo = document.getElementById("nav-logo-anchor");
    const floatingLogo = logoRef.current;

    if (!anchor || !navLogo || !floatingLogo) return;

    const anchorRect = anchor.getBoundingClientRect();
    const navRect = navLogo.getBoundingClientRect();
    const previous = boundsRef.current;

    const startCenterX = anchorRect.left + anchorRect.width / 2;
    const startCenterY = anchorRect.top + anchorRect.height / 2;

    boundsRef.current = {
      startCenterX:
        previous && window.scrollY > 2 ? previous.startCenterX : startCenterX,
      startCenterY:
        previous && window.scrollY > 2 ? previous.startCenterY : startCenterY,
      endX: navRect.left,
      endY: navRect.top,
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
      if (window.scrollY <= 2) {
        boundsRef.current = null;
      }
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
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
      className="pointer-events-none fixed z-[60]"
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
      <SudarLogoLink
        ref={logoRef}
        className="pointer-events-auto flex items-center gap-2.5 sm:gap-3 text-xl sm:text-2xl font-bold tracking-tighter font-serif text-white shrink-0"
      />
    </motion.div>
  );
}

"use client";

import { motion, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { DemoHotspot } from "@/data/heroFlowDemo";
import { ClickRipple } from "@/components/demo/ClickRipple";

type HeroDemoCursorProps = {
  hotspot?: DemoHotspot;
  action?: "click" | "hover";
  stepKey: string;
  containerRef: React.RefObject<HTMLElement | null>;
};

const SPRING = { stiffness: 120, damping: 22, mass: 0.85 };
const REST = { x: 78, y: 12 };

export function HeroDemoCursor({
  hotspot,
  action = "click",
  stepKey,
  containerRef,
}: HeroDemoCursorProps) {
  const reducedMotion = useReducedMotion();
  const [clickFlash, setClickFlash] = useState(false);
  const [ready, setReady] = useState(false);
  const positionRef = useRef(REST);

  const springX = useSpring(REST.x, SPRING);
  const springY = useSpring(REST.y, SPRING);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const target = hotspot ?? REST;
    const rect = el.getBoundingClientRect();
    const px = (target.x / 100) * rect.width;
    const py = (target.y / 100) * rect.height;

    const from = positionRef.current;
    const midX = from.x + (px - from.x) * 0.12;
    const midY = from.y + (py - from.y) * 0.08;

    springX.set(midX);
    springY.set(midY);

    const t1 = window.setTimeout(() => {
      springX.set(px);
      springY.set(py);
      positionRef.current = { x: px, y: py };
    }, 80);

    setReady(true);

    return () => clearTimeout(t1);
  }, [stepKey, hotspot, containerRef, springX, springY]);

  useEffect(() => {
    if (reducedMotion || action !== "click" || !hotspot) {
      setClickFlash(false);
      return;
    }
    const arriveMs = 900;
    let flashOff: number | undefined;
    const clickTimer = window.setTimeout(() => {
      setClickFlash(true);
      flashOff = window.setTimeout(() => setClickFlash(false), 480);
    }, arriveMs);
    return () => {
      clearTimeout(clickTimer);
      if (flashOff) clearTimeout(flashOff);
    };
  }, [stepKey, action, hotspot, reducedMotion]);

  if (reducedMotion || !hotspot) return null;

  const rippleX = hotspot.x;
  const rippleY = hotspot.y;

  return (
    <>
      <ClickRipple x={rippleX} y={rippleY} show={clickFlash} />
      <motion.div
        className="absolute pointer-events-none z-40 will-change-transform"
        style={{
          left: springX,
          top: springY,
          x: "-4px",
          y: "-2px",
          opacity: ready ? 1 : 0,
        }}
        animate={{
          scale: clickFlash ? [1, 0.88, 1.02, 1] : 1,
        }}
        transition={{
          scale: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.25 },
        }}
        aria-hidden
      >
        <svg
          width="26"
          height="30"
          viewBox="0 0 24 28"
          fill="none"
          className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
        >
          <path
            d="M5 3L5 22L10 17L14 25L17 23L13 15L20 15L5 3Z"
            fill="white"
            stroke="rgba(0,0,0,0.4)"
            strokeWidth="1"
          />
        </svg>
      </motion.div>
    </>
  );
}

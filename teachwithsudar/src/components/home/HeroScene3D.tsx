"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useCallback, useRef, type ReactNode } from "react";

type HeroScene3DProps = {
  children: ReactNode;
  reducedMotion: boolean;
};

export function HeroScene3D({ children, reducedMotion }: HeroScene3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), {
    stiffness: 140,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), {
    stiffness: 140,
    damping: 24,
  });

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reducedMotion || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      mx.set((e.clientX - rect.left) / rect.width - 0.5);
      my.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [mx, my, reducedMotion]
  );

  const onLeave = useCallback(() => {
    mx.set(0);
    my.set(0);
  }, [mx, my]);

  if (reducedMotion) {
    return <div className="relative w-full">{children}</div>;
  }

  return (
    <div
      ref={ref}
      className="hero-scene-3d relative w-full"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ perspective: "1400px" }}
    >
      <motion.div
        className="relative w-full [transform-style:preserve-3d]"
        style={{ rotateX, rotateY }}
      >
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-60"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,69,0,0.12) 0%, transparent 40%, transparent 60%, rgba(124,58,237,0.08) 100%)",
          }}
          aria-hidden
        />
        <div className="relative rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)]">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

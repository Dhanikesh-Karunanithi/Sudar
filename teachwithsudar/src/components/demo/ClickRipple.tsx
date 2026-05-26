"use client";

import { motion } from "framer-motion";

type ClickRippleProps = {
  x: number;
  y: number;
  show: boolean;
};

export function ClickRipple({ x, y, show }: ClickRippleProps) {
  if (!show) return null;
  return (
    <motion.div
      className="absolute pointer-events-none z-20"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
      initial={{ opacity: 0.8, scale: 0.4 }}
      animate={{ opacity: 0, scale: 2.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <span className="block w-10 h-10 rounded-full border-2 border-[#FF4500]/60 bg-[#FF4500]/10" />
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";

type StaggerWordsProps = {
  text: string;
  className?: string;
  wordClassName?: string;
  stagger?: number;
  delay?: number;
};

export function StaggerWords({
  text,
  className = "",
  wordClassName = "",
  stagger = 0.08,
  delay = 0,
}: StaggerWordsProps) {
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <span className={`inline-flex flex-wrap justify-center gap-x-[0.28em] ${className}`}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className={`inline-block ${wordClassName}`}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            delay: delay + i * stagger,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

"use client";

import Image from "next/image";
import type { ReactNode } from "react";

type LessonVideoThumbProps = {
  className?: string;
  sizes?: string;
  rounded?: string;
  overlayLabel?: string;
  dimmed?: boolean;
  children?: ReactNode;
};

/** Fills frame edge-to-edge, no flat letterbox / sharp top on Prison Mike asset */
export function LessonVideoThumb({
  className = "",
  sizes = "500px",
  rounded = "rounded-xl",
  overlayLabel,
  dimmed = false,
  children,
}: LessonVideoThumbProps) {
  return (
    <div
      className={`relative aspect-video overflow-hidden border border-zinc-200/80 bg-gradient-to-b from-violet-950 via-zinc-800 to-zinc-950 ${rounded} ${className}`}
    >
      <Image
        src="/characters/prison-mike.png"
        alt="Lesson video"
        fill
        className="object-cover object-[center_38%] scale-[1.18]"
        sizes={sizes}
        priority
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-violet-900/25 pointer-events-none"
        aria-hidden
      />
      {dimmed ? <div className="absolute inset-0 bg-black/25 pointer-events-none" aria-hidden /> : null}
      {overlayLabel ? (
        <p className="absolute bottom-2 left-2 z-10 text-[9px] text-white bg-black/50 px-2 py-0.5 rounded">
          {overlayLabel}
        </p>
      ) : null}
      {children}
    </div>
  );
}

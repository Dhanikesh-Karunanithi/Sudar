"use client";

import { motion } from "framer-motion";

type VideoControlsProps = {
  visible: boolean;
  playing: boolean;
  progress: number;
  soundEnabled: boolean;
  onPlayPause: () => void;
  onToggleSound: () => void;
};

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}

function SoundOnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.74 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}

function SoundOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    </svg>
  );
}

export function VideoControls({
  visible,
  playing,
  progress,
  soundEnabled,
  onPlayPause,
  onToggleSound,
}: VideoControlsProps) {
  return (
    <motion.div
      className="absolute inset-x-0 bottom-0 z-50 pointer-events-none"
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050505]/90 to-transparent pointer-events-none" />

      <div className="relative flex items-center justify-center gap-4 pb-6 pointer-events-auto">
        <button
          type="button"
          onClick={onToggleSound}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm border border-white/15 hover:bg-white/20 transition-colors"
          aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
        >
          {soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
        </button>
        <button
          type="button"
          onClick={onPlayPause}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm border border-white/15 hover:bg-white/20 transition-colors"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/[0.08]">
        <motion.div
          className="h-full bg-[#FF4500]/80"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 0.15 }}
        />
      </div>
    </motion.div>
  );
}

"use client";

import type { DemoChapter } from "@/data/ecosystemDemo";

export type PlaybackSpeed = 0.75 | 1 | 1.5;

type TransportBarProps = {
  playing: boolean;
  globalIndex: number;
  totalSteps: number;
  chapters: DemoChapter[];
  currentChapterId: string;
  speed: PlaybackSpeed;
  onPlayPause: () => void;
  onScrub: (index: number) => void;
  onChapterJump: (chapterId: string) => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  onRestart: () => void;
};

export function TransportBar({
  playing,
  globalIndex,
  totalSteps,
  chapters,
  currentChapterId,
  speed,
  onPlayPause,
  onScrub,
  onChapterJump,
  onSpeedChange,
  onRestart,
}: TransportBarProps) {
  const progress = totalSteps > 1 ? (globalIndex / (totalSteps - 1)) * 100 : 0;

  return (
    <div className="border-t border-card-border bg-[#080808] px-4 py-4 sm:px-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onPlayPause}
          className="rounded-full bg-primary/90 hover:bg-primary text-white px-4 py-2 text-sm font-medium transition-colors"
          aria-label={playing ? "Pause tour" : "Play tour"}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="rounded-full border border-card-border px-4 py-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          Restart
        </button>
        <div className="flex items-center gap-1 ml-auto">
          {([0.75, 1, 1.5] as PlaybackSpeed[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeedChange(s)}
              className={`rounded-full px-3 py-1 text-[11px] font-mono border transition-colors ${
                speed === s
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-card-border text-foreground-muted hover:text-foreground"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-foreground-muted shrink-0 w-8">
          {globalIndex + 1}
        </span>
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={globalIndex}
          onChange={(e) => onScrub(Number(e.target.value))}
          className="flex-1 h-1.5 accent-[#ff4500] bg-white/10 rounded-full cursor-pointer"
          aria-label="Scrub through demo steps"
        />
        <span className="text-[10px] font-mono text-foreground-muted shrink-0 w-8 text-right">
          {totalSteps}
        </span>
      </div>
      <div
        className="h-0.5 rounded-full bg-white/[0.06] overflow-hidden -mt-2"
        aria-hidden
      >
        <div className="h-full bg-primary/60 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
        {chapters.map((ch) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => onChapterJump(ch.id)}
            className={`rounded-full px-3 py-1 text-[10px] font-mono border transition-colors ${
              ch.id === currentChapterId
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-card-border text-foreground-muted hover:border-primary/20 hover:text-foreground"
            }`}
          >
            {ch.title}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-foreground-muted font-mono">
        Space · play/pause · Arrow keys · prev/next step
      </p>
    </div>
  );
}

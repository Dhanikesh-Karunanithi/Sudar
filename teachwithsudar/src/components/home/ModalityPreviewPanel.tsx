import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { SudarLogoMark } from "@/components/brand/SudarLogoMark";

export type ModalityPreviewId =
  | "Text"
  | "Video"
  | "Audio"
  | "Mind Map"
  | "Flashcards"
  | "SudarFeed"
  | "SudarPlay";

export type ModalityPreviewMode = {
  id: ModalityPreviewId;
  name: string;
  tag: string;
  desc: string;
};

type ModalityPreviewPanelProps = {
  active: ModalityPreviewMode | null;
  onClose: () => void;
};

function PanelChrome({
  title,
  subtitle,
  panelId,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  panelId: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d0d] shadow-[0_24px_100px_rgba(0,0,0,0.55)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={panelId}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.9]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 0%, rgba(255,69,0,0.10) 0%, transparent 60%)",
        }}
      />
      <div className="relative p-6 sm:p-7">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.35em] text-[#FF4500]/60 uppercase font-mono">
              Preview
            </p>
            <h3 id={panelId} className="mt-3 text-xl sm:text-2xl font-serif font-medium text-white leading-[1.1] tracking-tight truncate">
              {title}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-zinc-500 font-light leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:block opacity-[0.16]">
              <SudarLogoMark size={40} variant="on-dark" />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="group inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.14] px-3.5 py-2 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4500]/50"
              aria-label="Close preview"
            >
              <span className="hidden sm:inline text-[11px] text-zinc-500 group-hover:text-zinc-400 font-mono tracking-wide">
                Close
              </span>
              <svg
                className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function MiniChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[10px] font-mono tracking-widest text-zinc-600">
      {children}
    </span>
  );
}

function PlaceholderLine({ w }: { w: string }) {
  return <div className={`h-2 rounded-full bg-white/[0.06] ${w}`} />;
}

function ScreenFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#0b0b0b]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white/[0.10]" />
          <span className="w-2 h-2 rounded-full bg-white/[0.10]" />
          <span className="w-2 h-2 rounded-full bg-white/[0.10]" />
        </div>
        <div className="flex items-center gap-2 opacity-[0.14]">
          <SudarLogoMark size={22} variant="on-dark" />
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function TextPreview() {
  return (
    <ScreenFrame>
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_260px] gap-4">
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4">
          <p className="text-[10px] font-mono tracking-widest text-zinc-700 uppercase mb-3">Sections</p>
          <div className="space-y-2">
            {["01 Intro", "02 Concepts", "03 Examples", "04 Checkpoint"].map((s) => (
              <div
                key={s}
                className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2"
              >
                <span className="text-[11px] text-zinc-500">{s}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500]/40" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-[11px] text-white/80 font-medium">Module: Foundations</p>
            <div className="flex flex-wrap gap-2">
              <MiniChip>READ</MiniChip>
              <MiniChip>SUMMARY</MiniChip>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-5 rounded-lg bg-white/[0.06] w-[70%]" />
            <PlaceholderLine w="w-[96%]" />
            <PlaceholderLine w="w-[92%]" />
            <PlaceholderLine w="w-[88%]" />
            <div className="h-24 rounded-xl border border-white/[0.06] bg-[#0b0b0b] p-4">
              <p className="text-[10px] font-mono tracking-widest text-[#FF4500]/60 uppercase mb-2">
                Key takeaway
              </p>
              <PlaceholderLine w="w-[85%]" />
              <div className="mt-2">
                <PlaceholderLine w="w-[70%]" />
              </div>
            </div>
            <PlaceholderLine w="w-[93%]" />
            <PlaceholderLine w="w-[76%]" />
          </div>
        </div>

        <div className="rounded-xl border border-[#FF4500]/12 bg-[#FF4500]/[0.03] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-mono tracking-widest text-[#FF4500]/60 uppercase">
              Sudar summary
            </p>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500]/60" />
          </div>
          <div className="space-y-2">
            <PlaceholderLine w="w-[92%]" />
            <PlaceholderLine w="w-[88%]" />
            <PlaceholderLine w="w-[76%]" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <MiniChip>ASK_SUDAR</MiniChip>
            <MiniChip>HIGHLIGHT</MiniChip>
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}

function VideoPreview() {
  return (
    <ScreenFrame>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-white/[0.06] to-white/[0.02] relative">
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0.18, 0.28, 0.18] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(255,69,0,0.24), rgba(0,0,0,0) 58%)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-16 h-16 rounded-full border border-white/[0.10] bg-white/[0.04] flex items-center justify-center"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 1.7, ease: "easeInOut" }}
              >
                <svg
                  className="w-7 h-7 text-white/70"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </motion.div>
            </div>
            <div className="absolute left-4 bottom-4 flex gap-2">
              <MiniChip>CAPTIONS</MiniChip>
              <MiniChip>1.25X</MiniChip>
            </div>
          </div>
          <div className="p-4 border-t border-white/[0.06]">
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full bg-[#FF4500]/60"
                animate={{ width: ["18%", "65%", "38%"] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[11px] text-zinc-500">03:12 / 07:08</p>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4">
          <p className="text-[10px] font-mono tracking-widest text-zinc-700 uppercase mb-3">Transcript</p>
          <motion.div
            className="space-y-2"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
            }}
          >
            <div className="rounded-lg border border-[#FF4500]/15 bg-[#FF4500]/[0.04] p-3">
              <PlaceholderLine w="w-[92%]" />
              <div className="mt-2">
                <PlaceholderLine w="w-[74%]" />
              </div>
            </div>
            <motion.div
              className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3"
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
            >
              <PlaceholderLine w="w-[90%]" />
              <div className="mt-2">
                <PlaceholderLine w="w-[62%]" />
              </div>
            </motion.div>
            <motion.div
              className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3"
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
            >
              <PlaceholderLine w="w-[86%]" />
              <div className="mt-2">
                <PlaceholderLine w="w-[72%]" />
              </div>
            </motion.div>
          </motion.div>
          <div className="mt-4 flex flex-wrap gap-2">
            <MiniChip>NOTES</MiniChip>
            <MiniChip>HIGHLIGHTS</MiniChip>
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}

function AudioPreview() {
  const audioBars = [14, 22, 12, 18, 24, 10, 16, 28, 12, 19, 13, 22, 11, 26, 16, 20];

  return (
    <ScreenFrame>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-[11px] text-white/80 font-medium">Episode: Chapter 2</p>
              <p className="text-[11px] text-zinc-600">Narrated by Sudar</p>
            </div>
            <MiniChip>TTS</MiniChip>
          </div>
          <div className="h-16 rounded-xl border border-white/[0.06] bg-[#0b0b0b] flex items-end gap-1 px-3 py-3">
            {audioBars.map((base, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-sm"
                style={{
                  height: `${base}px`,
                  background: i % 5 === 0 ? "rgba(255,69,0,0.55)" : "rgba(255,255,255,0.10)",
                  transformOrigin: "bottom",
                }}
                animate={{ scaleY: [0.6, 1.3, 0.8, 1.15, 0.65] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.6 + ((i % 4) * 0.2),
                  ease: "easeInOut",
                  delay: i * 0.04,
                }}
              />
            ))}
          </div>
          <div className="mt-4 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full bg-[#FF4500]/60"
              animate={{ width: ["15%", "48%", "30%"] }}
              transition={{ repeat: Infinity, duration: 3.4, ease: "easeInOut" }}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[11px] text-white/80"
            >
              <motion.span
                className="w-2 h-2 rounded-full bg-[#FF4500]/70"
                animate={{ opacity: [0.45, 1, 0.45] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              />
              Play
            </button>
            <MiniChip>0.9X</MiniChip>
            <MiniChip>VOICE_A</MiniChip>
            <MiniChip>CAPTIONS</MiniChip>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4">
          <p className="text-[10px] font-mono tracking-widest text-zinc-700 uppercase mb-3">Now playing</p>
          <div className="space-y-2">
            {["Intro", "Concepts", "Example walkthrough", "Quick recap"].map((t, idx) => (
              <div
                key={t}
                className={`rounded-lg border px-3 py-2 ${
                  idx === 1
                    ? "border-[#FF4500]/15 bg-[#FF4500]/[0.04]"
                    : "border-white/[0.05] bg-white/[0.02]"
                }`}
              >
                <p className="text-[11px] text-zinc-500">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}

function MindMapPreview() {
  const Node = ({ label, active }: { label: string; active?: boolean }) => (
    <div
      className={`rounded-xl border px-3 py-2 text-[11px] ${
        active
          ? "border-[#FF4500]/18 bg-[#FF4500]/[0.04] text-white/80"
          : "border-white/[0.06] bg-[#0d0d0d] text-zinc-500"
      }`}
    >
      {label}
    </div>
  );

  return (
    <ScreenFrame>
      <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] text-white/80 font-medium">Concept map</p>
          <div className="flex gap-2">
            <MiniChip>ZOOM</MiniChip>
            <MiniChip>FOCUS</MiniChip>
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div className="space-y-3">
              <Node label="Definitions" />
              <Node label="Examples" />
              <Node label="Common mistakes" />
            </div>

            <div className="flex items-center justify-center">
              <Node label="Core concept" active />
            </div>

            <div className="space-y-3">
              <Node label="Applications" />
              <Node label="Checklist" />
              <Node label="Assessment" />
            </div>
          </div>

          {/* connectors */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute left-[33%] top-[22%] w-[34%] h-px bg-white/[0.06]" />
            <div className="absolute left-[33%] top-[50%] w-[34%] h-px bg-white/[0.06]" />
            <div className="absolute left-[33%] top-[78%] w-[34%] h-px bg-white/[0.06]" />
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}

function FlashcardsPreview() {
  return (
    <ScreenFrame>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] text-white/80 font-medium">Card 3 of 12</p>
            <div className="flex gap-2">
              <MiniChip>RECALL</MiniChip>
              <MiniChip>SRS</MiniChip>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-[#0b0b0b] p-5">
            <p className="text-[10px] font-mono tracking-widest text-zinc-700 uppercase mb-3">Question</p>
            <div className="space-y-2">
              <div className="h-3 rounded-full bg-white/[0.06] w-[82%]" />
              <div className="h-3 rounded-full bg-white/[0.06] w-[65%]" />
            </div>
            <div className="mt-5 rounded-xl border border-[#FF4500]/12 bg-[#FF4500]/[0.03] p-4">
              <p className="text-[10px] font-mono tracking-widest text-[#FF4500]/60 uppercase mb-2">
                Show answer
              </p>
              <PlaceholderLine w="w-[74%]" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Again", "Hard", "Good", "Easy"].map((t, idx) => (
              <span
                key={t}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-mono tracking-widest ${
                  idx === 2
                    ? "border-[#FF4500]/18 bg-[#FF4500]/[0.05] text-[#FF4500]/80"
                    : "border-white/[0.07] bg-white/[0.03] text-zinc-600"
                }`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4">
          <p className="text-[10px] font-mono tracking-widest text-zinc-700 uppercase mb-3">Schedule</p>
          <div className="space-y-2">
            {[
              ["Due now", "4"],
              ["Today", "9"],
              ["This week", "18"],
            ].map(([k, v], idx) => (
              <div
                key={k}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                  idx === 0
                    ? "border-[#FF4500]/15 bg-[#FF4500]/[0.04]"
                    : "border-white/[0.05] bg-white/[0.02]"
                }`}
              >
                <span className="text-[11px] text-zinc-500">{k}</span>
                <span className="text-[11px] text-white/60 font-mono">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <MiniChip>STREAK</MiniChip>
            <MiniChip>MASTERED</MiniChip>
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}

function SudarFeedPreview() {
  const reels = [
    { title: "Micro-lesson: Cognitive load", color: "from-[#0f4836] to-[#0a7b52]" },
    { title: "Checkpoint: Spot the gap", color: "from-[#2d3f9a] to-[#4f55d9]" },
    { title: "Quick recap: 3 key ideas", color: "from-[#3b2a56] to-[#6f3cb8]" },
  ];

  return (
    <ScreenFrame>
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 items-start">
        <div className="mx-auto w-full max-w-[280px] rounded-[28px] border border-white/[0.07] bg-[#090909] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
          <div className="relative rounded-[20px] border border-white/[0.08] bg-black overflow-hidden h-[470px]">
            <motion.div
              className="absolute inset-x-0"
              animate={{ y: ["0%", "-33.33%", "-66.66%", "0%"] }}
              transition={{ repeat: Infinity, duration: 11, ease: "easeInOut" }}
            >
              {[...reels, ...reels].map((reel, idx) => (
                <div key={`${reel.title}-${idx}`} className="h-[470px] p-4">
                  <div className={`h-full rounded-2xl bg-gradient-to-br ${reel.color} p-4 flex flex-col justify-between`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-widest text-white/75">SUDARFEED</span>
                      <span className="text-[10px] text-white/65">00:22</span>
                    </div>
                    <div>
                      <div className="h-2 rounded-full bg-white/20 w-[86%] mb-2" />
                      <div className="h-2 rounded-full bg-white/20 w-[62%] mb-4" />
                      <p className="text-2xl leading-[1.1] font-bold text-white">{reel.title}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <MiniChip>SAVE</MiniChip>
                        <MiniChip>QUIZ</MiniChip>
                      </div>
                      <MiniChip>ASK</MiniChip>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4">
          <p className="text-[10px] font-mono tracking-widest text-zinc-700 uppercase mb-3">Feed behavior</p>
          <div className="space-y-2">
            <div className="rounded-lg border border-[#FF4500]/15 bg-[#FF4500]/[0.04] p-3">
              <p className="text-[11px] text-zinc-400">Vertical reel flow with bite-sized learning cards.</p>
            </div>
            <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
              <p className="text-[11px] text-zinc-500">Auto-scroll loop simulates swipe-through discovery.</p>
            </div>
            <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
              <p className="text-[11px] text-zinc-500">Every reel can branch to quiz, save, or ask Sudar.</p>
            </div>
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}

function SudarPlayPreview() {
  const pixelBlocks = Array.from({ length: 16 });

  return (
    <ScreenFrame>
      <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d0d] overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] bg-[#0b0b0b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MiniChip>ARCADE_MODE</MiniChip>
            <MiniChip>LEVEL_1</MiniChip>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-zinc-700">PROGRESS</span>
            <div className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full w-[55%] bg-[#FF4500]/60" />
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="rounded-xl border border-white/[0.06] bg-[#5c90e8] overflow-hidden">
            <div className="px-4 py-2 bg-[#4d7dd0] border-b border-black/20 flex items-center justify-between text-white/90 text-[10px] font-mono tracking-widest">
              <span>SCORE 0120</span>
              <span>TIME 397</span>
              <span>LIVES 03</span>
            </div>

            <div className="relative h-56">
              <motion.div
                className="absolute top-7 left-8 w-10 h-10 bg-white/90 border-2 border-black/40"
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute top-10 left-24 w-6 h-6 bg-[#f9b24a] border-2 border-black/35"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute top-8 right-14 w-12 h-6 bg-white/90 border-2 border-black/20"
                animate={{ x: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 4.4, ease: "easeInOut" }}
              />
              <div className="absolute left-1/2 -translate-x-1/2 top-14 text-center">
                <p className="text-3xl sm:text-4xl font-bold leading-[0.95] text-white drop-shadow-[1px_2px_0_rgba(0,0,0,0.25)]">
                  SUDAR PLAY
                </p>
                <p className="mt-3 text-[11px] font-mono text-white/85 tracking-widest">
                  PRESS START LEARNING
                </p>
              </div>

              <div className="absolute bottom-0 inset-x-0 h-16 bg-[#8f5a2f] border-t-4 border-black/20 px-2 pt-2">
                <div className="grid grid-cols-8 gap-1">
                  {pixelBlocks.map((_, i) => (
                    <div key={i} className="h-3 bg-[#aa6e38] border border-black/20" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {["Mission: help a learner recover from confusion.", "Power-up: adaptive hints + modality switch."].map(
              (line, idx) => (
                <div
                  key={line}
                  className={`rounded-xl border px-4 py-3 ${
                    idx === 0
                      ? "border-[#FF4500]/18 bg-[#FF4500]/[0.05]"
                      : "border-white/[0.06] bg-white/[0.02]"
                  }`}
                >
                  <p className="text-[11px] text-zinc-500">{line}</p>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}

function PreviewForMode({ id }: { id: ModalityPreviewId }) {
  switch (id) {
    case "Text":
      return <TextPreview />;
    case "Video":
      return <VideoPreview />;
    case "Audio":
      return <AudioPreview />;
    case "Mind Map":
      return <MindMapPreview />;
    case "Flashcards":
      return <FlashcardsPreview />;
    case "SudarFeed":
      return <SudarFeedPreview />;
    case "SudarPlay":
      return <SudarPlayPreview />;
  }
}

export function ModalityPreviewPanel({ active, onClose }: ModalityPreviewPanelProps) {
  const panelId = React.useId();

  React.useEffect(() => {
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);

  React.useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, onClose]);

  return (
    <AnimatePresence initial={false} mode="wait">
      {active ? (
        <motion.div
          key={active.id}
          id="modality-preview-overlay"
          className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            aria-label="Close preview overlay"
            onClick={onClose}
          />

          <motion.div
            className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto"
            initial={{ opacity: 0, y: 26, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <PanelChrome panelId={panelId} title={active.name} subtitle={active.desc} onClose={onClose}>
              <PreviewForMode id={active.id} />
            </PanelChrome>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}


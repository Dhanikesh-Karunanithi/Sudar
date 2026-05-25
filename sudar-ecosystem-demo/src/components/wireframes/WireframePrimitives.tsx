"use client";

import { motion } from "framer-motion";
import { SudarLogoMark } from "@/components/brand/SudarLogoMark";
import { useWireframeCinematic } from "./WireframeCinematicContext";

export type WireframeVariant = "studio" | "learn";

const ACCENT = {
  studio: {
    primary: "#FF4500",
    chipActive: "border-[#FF4500]/40 bg-[#FF4500]/10 text-[#FF4500]/80",
    chipIdle: "border-white/[0.07] bg-white/[0.03] text-zinc-600",
    pulseBorder: "border-[#FF4500]/25 bg-[#FF4500]/[0.06]",
    placeholder: "bg-white/[0.06]",
  },
  learn: {
    primary: "#7C3AED",
    chipActive: "border-violet-500/40 bg-violet-500/10 text-violet-700",
    chipIdle: "border-zinc-200 bg-zinc-50 text-zinc-500",
    pulseBorder: "border-violet-400/40 bg-violet-50",
    placeholder: "bg-zinc-200",
  },
};

export function MiniChip({
  children,
  active,
  variant = "studio",
}: {
  children: React.ReactNode;
  active?: boolean;
  variant?: WireframeVariant;
}) {
  const a = ACCENT[variant];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-mono tracking-widest ${
        active ? a.chipActive : a.chipIdle
      }`}
    >
      {children}
    </span>
  );
}

export function PlaceholderLine({
  w,
  variant = "studio",
}: {
  w: string;
  variant?: WireframeVariant;
}) {
  return <div className={`h-2 rounded-full ${ACCENT[variant].placeholder} ${w}`} />;
}

export function WireframeScreen({
  label,
  children,
  pulse = false,
  cinematic: cinematicProp,
  variant = "studio",
}: {
  label?: string;
  children: React.ReactNode;
  pulse?: boolean;
  cinematic?: boolean;
  variant?: WireframeVariant;
}) {
  const cinematicCtx = useWireframeCinematic();
  const cinematic = cinematicProp ?? cinematicCtx;
  const isLearn = variant === "learn";

  return (
    <div
      className={`w-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] ${
        isLearn
          ? "bg-white border border-zinc-200/80"
          : "bg-[#0a0a0a] border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
      } ${cinematic ? "rounded-3xl overflow-hidden" : "rounded-2xl overflow-hidden"}`}
    >
      <div
        className={`flex items-center justify-between border-b ${
          isLearn
            ? "border-zinc-100 bg-zinc-50/80"
            : "border-white/[0.06] bg-[#0b0b0b]"
        } ${cinematic ? "px-5 py-4" : "px-4 py-3"}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full ${isLearn ? "bg-zinc-300" : "bg-white/[0.10]"} ${
              cinematic ? "w-2.5 h-2.5" : "w-2 h-2"
            }`}
          />
          <span
            className={`rounded-full ${isLearn ? "bg-zinc-300" : "bg-white/[0.10]"} ${
              cinematic ? "w-2.5 h-2.5" : "w-2 h-2"
            }`}
          />
          <span
            className={`rounded-full ${isLearn ? "bg-zinc-300" : "bg-white/[0.10]"} ${
              cinematic ? "w-2.5 h-2.5" : "w-2 h-2"
            }`}
          />
        </div>
        {label ? (
          <span
            className={`font-mono tracking-widest uppercase ${
              isLearn ? "text-zinc-400" : "text-zinc-600"
            } ${cinematic ? "text-[11px]" : "text-[10px]"}`}
          >
            {label}
          </span>
        ) : null}
        <div className={`flex items-center gap-2 ${isLearn ? "opacity-90" : "opacity-[0.14]"}`}>
          <SudarLogoMark
            size={cinematic ? 28 : 22}
            variant={isLearn ? "on-light" : "on-dark"}
            className={pulse ? "animate-pulse" : undefined}
          />
        </div>
      </div>
      <div className={`${cinematic ? "p-5 sm:p-6 min-h-[280px]" : "p-4 sm:p-5 min-h-[280px]"}`}>
        {children}
      </div>
    </div>
  );
}

export function PulseHighlight({
  children,
  active,
  variant = "studio",
}: {
  children: React.ReactNode;
  active?: boolean;
  variant?: WireframeVariant;
}) {
  const isLearn = variant === "learn";
  if (!active) {
    return (
      <div
        className={`rounded-lg border p-3 ${
          isLearn ? "border-zinc-200 bg-zinc-50/50" : "border-white/[0.06]"
        }`}
      >
        {children}
      </div>
    );
  }
  if (isLearn) {
    return (
      <motion.div
        className="rounded-lg border border-violet-400/35 bg-violet-50 p-3"
        animate={{
          boxShadow: [
            "0 0 0 rgba(124,58,237,0)",
            "0 0 24px rgba(124,58,237,0.12)",
            "0 0 0 rgba(124,58,237,0)",
          ],
        }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    );
  }
  return (
    <motion.div
      className="rounded-lg border border-[#FF4500]/25 bg-[#FF4500]/[0.06] p-3"
      animate={{
        boxShadow: [
          "0 0 0 rgba(255,69,0,0)",
          "0 0 24px rgba(255,69,0,0.12)",
          "0 0 0 rgba(255,69,0,0)",
        ],
      }}
      transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

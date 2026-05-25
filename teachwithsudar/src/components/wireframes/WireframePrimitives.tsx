"use client";

import { motion } from "framer-motion";
import { SudarLogoMark } from "@/components/brand/SudarLogoMark";

export function MiniChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[10px] font-mono tracking-widest text-zinc-600">
      {children}
    </span>
  );
}

export function PlaceholderLine({ w }: { w: string }) {
  return <div className={`h-2 rounded-full bg-white/[0.06] ${w}`} />;
}

export function WireframeScreen({
  label,
  children,
  pulse = false,
}: {
  label?: string;
  children: React.ReactNode;
  pulse?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#0b0b0b]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white/[0.10]" />
          <span className="w-2 h-2 rounded-full bg-white/[0.10]" />
          <span className="w-2 h-2 rounded-full bg-white/[0.10]" />
        </div>
        {label ? (
          <span className="text-[10px] font-mono tracking-widest text-zinc-600 uppercase">{label}</span>
        ) : null}
        <div className="flex items-center gap-2 opacity-[0.14]">
          <SudarLogoMark size={22} variant="on-dark" className={pulse ? "animate-pulse" : undefined} />
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

export function PulseHighlight({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="rounded-lg border border-[#FF4500]/25 bg-[#FF4500]/[0.06] p-3"
      animate={{ boxShadow: ["0 0 0 rgba(255,69,0,0)", "0 0 24px rgba(255,69,0,0.12)", "0 0 0 rgba(255,69,0,0)"] }}
      transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

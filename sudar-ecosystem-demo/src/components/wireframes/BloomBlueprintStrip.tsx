"use client";

import type { BloomLevel, SceneState } from "@/types/sceneState";
import { MiniChip } from "./WireframePrimitives";

export function BloomBlueprintStrip({ state }: { state: SceneState }) {
  const bloom = state.bloomLevel ?? "Apply";

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0d0d0d] p-4 space-y-3">
      <p className="text-[10px] font-mono text-[#FF4500]/70 uppercase tracking-widest">
        Instructional design
      </p>
      <div className="flex flex-wrap gap-2">
        <MiniChip active>BLOOM · {bloom.toUpperCase()}</MiniChip>
        <MiniChip>SCENARIO ARC</MiniChip>
        <MiniChip>ANDRAGOGY</MiniChip>
      </div>
      <div className="rounded-lg border border-white/[0.06] px-3 py-2">
        <p className="text-[10px] text-zinc-600 uppercase mb-1">Learning objective</p>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Apply delegation and feedback techniques in a retail management context.
        </p>
      </div>
      <div className="rounded-lg border border-[#FF4500]/20 bg-[#FF4500]/[0.04] px-3 py-2">
        <p className="text-[10px] text-zinc-600 uppercase mb-1">Archetype</p>
        <p className="text-[11px] text-zinc-400">Workplace scenario · Examples-first</p>
      </div>
      <p className="text-[9px] text-zinc-600 font-mono">
        Pipeline: blueprint → modules → blocks (video, audio, interactive)
      </p>
    </div>
  );
}

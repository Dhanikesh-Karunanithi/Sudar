"use client";

import { SudarLogoMark } from "@/components/brand/SudarLogoMark";
import type { SceneState } from "@/types/sceneState";

const NAV = ["Learn", "Courses", "Paths", "Progress", "Memory"] as const;

export function LearnNavChrome({ state }: { state: SceneState }) {
  const active = state.learnNavActive ?? "Learn";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-100">
      <div className="flex items-center gap-2">
        <SudarLogoMark size={24} variant="on-light" />
        <span className="text-[13px] font-semibold text-zinc-900">Sudar</span>
      </div>
      <div className="hidden sm:flex items-center gap-1">
        {NAV.map((item) => (
          <span
            key={item}
            className={`text-[10px] font-medium px-3 py-1.5 rounded-full ${
              item === active
                ? "bg-violet-600 text-white"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {item}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="h-7 w-24 rounded-full bg-zinc-100 border border-zinc-200" />
        <div className="flex items-center gap-1.5 rounded-full bg-violet-100 px-2 py-1">
          <span className="w-6 h-6 rounded-full bg-violet-600 text-[9px] text-white flex items-center justify-center font-medium">
            MK
          </span>
          <span className="text-[10px] text-zinc-700 hidden md:inline">Marcus K.</span>
        </div>
      </div>
    </div>
  );
}

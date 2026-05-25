"use client";

import type { ReactNode } from "react";

/** iPhone 15 Pro logical size, portrait only */
const PHONE_W = 390;
const PHONE_H = 844;

function IosStatusIcons() {
  return (
    <div className="flex items-center gap-[5px]" aria-hidden>
      <svg width="17" height="11" viewBox="0 0 17 11" className="text-zinc-900">
        <rect x="0" y="6" width="3" height="5" rx="0.5" fill="currentColor" />
        <rect x="4.5" y="4" width="3" height="7" rx="0.5" fill="currentColor" />
        <rect x="9" y="2" width="3" height="9" rx="0.5" fill="currentColor" />
        <rect x="13.5" y="0" width="3" height="11" rx="0.5" fill="currentColor" />
      </svg>
      <svg width="15" height="11" viewBox="0 0 15 11" className="text-zinc-900">
        <path
          d="M7.5 2.2c1.8 0 3.4.7 4.6 1.9l1.2-1.2C11.8 1.4 9.8.5 7.5.5 5.2.5 3.2 1.4 1.7 2.9L3 4.1c1.2-1.2 2.8-1.9 4.5-1.9zm0 3.5c1.1 0 2 .4 2.7 1.2l1.2-1.2c-1-.9-2.2-1.5-3.9-1.5s-2.9.6-3.9 1.5l1.2 1.2c.7-.8 1.6-1.2 2.7-1.2zm0 3.5c.6 0 1.1.2 1.5.6l1.5-1.5C9.6 7.2 8.6 6.8 7.5 6.8s-2.1.4-3 1.3l1.5 1.5c.4-.4.9-.6 1.5-.6z"
          fill="currentColor"
        />
      </svg>
      <svg width="25" height="11" viewBox="0 0 25 11" className="text-zinc-900">
        <rect x="0.5" y="0.5" width="20" height="10" rx="2" stroke="currentColor" fill="none" opacity="0.35" />
        <rect x="2" y="2" width="15" height="7" rx="1" fill="currentColor" />
        <rect x="21.5" y="3.5" width="2.5" height="4" rx="0.5" fill="currentColor" opacity="0.4" />
      </svg>
    </div>
  );
}

/** iPhone portrait shell, fixed 9:19.5 aspect, never collapses to a square */
export function MobileDeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto h-[min(88vh,844px)] w-auto max-w-[min(42vw,390px)] shrink-0 aspect-[390/844]">
      {/* Side buttons */}
      <div
        className="absolute -left-[2px] top-[22%] h-8 w-[3px] rounded-l-sm bg-zinc-600"
        aria-hidden
      />
      <div
        className="absolute -left-[2px] top-[32%] h-14 w-[3px] rounded-l-sm bg-zinc-600"
        aria-hidden
      />
      <div
        className="absolute -left-[2px] top-[44%] h-14 w-[3px] rounded-l-sm bg-zinc-600"
        aria-hidden
      />
      <div
        className="absolute -right-[2px] top-[28%] h-16 w-[3px] rounded-r-sm bg-zinc-600"
        aria-hidden
      />

      {/* Titanium bezel */}
      <div className="absolute inset-0 rounded-[3.15rem] p-[3px] bg-gradient-to-b from-zinc-400 via-zinc-600 to-zinc-800 shadow-[0_48px_120px_rgba(0,0,0,0.75)]">
        <div className="absolute inset-[3px] rounded-[2.95rem] bg-zinc-950 p-[2px]">
          {/* Screen */}
          <div className="absolute inset-[2px] flex flex-col overflow-hidden rounded-[2.85rem] bg-white">
            <div
              className="absolute top-[11px] left-1/2 z-50 -translate-x-1/2 w-[118px] h-[31px] rounded-[18px] bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
              aria-hidden
            />

            <div className="relative z-40 flex shrink-0 items-end justify-between px-[22px] pt-[14px] pb-[6px] h-[52px] bg-white">
              <span className="text-[15px] font-semibold text-zinc-900 tabular-nums leading-none tracking-tight">
                9:41
              </span>
              <IosStatusIcons />
            </div>

            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
              {children}
            </div>

            <div className="relative z-40 flex h-[28px] shrink-0 items-center justify-center bg-white pb-1">
              <div className="h-[5px] w-[134px] rounded-full bg-zinc-900/20" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { EARLY_ACCESS_BANNER_COPY, isEarlyAccessBannerEnabled } from '@shared-access'

export function EarlyAccessBanner() {
  if (!isEarlyAccessBannerEnabled()) {
    return null
  }

  return (
    <div
      role="status"
      aria-label="Early access notice"
      className="border-b border-[#FF4500]/25 bg-zinc-950 px-4 py-2 text-center text-xs text-zinc-400"
    >
      <span className="font-semibold text-[#FF4500]">Sudar · Early Access</span>
      <span className="hidden sm:inline"> — {EARLY_ACCESS_BANNER_COPY.subtitle}</span>
    </div>
  )
}

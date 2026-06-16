"use client";

import {
  Children,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

type SwipeCardStripProps = {
  count: number;
  activeIndex: number;
  onIndexChange: (index: number) => void;
  children: ReactNode;
  showHint?: boolean;
  ariaLabel?: string;
  className?: string;
  slideClassName?: string;
};

export function SwipeCardStrip({
  count,
  activeIndex,
  onIndexChange,
  children,
  showHint = true,
  ariaLabel = "Swipeable cards",
  className = "",
  slideClassName = "",
}: SwipeCardStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const scrollRaf = useRef<number | null>(null);
  const programmaticScroll = useRef(false);

  const syncIndexFromScroll = useCallback(() => {
    const el = stripRef.current;
    if (!el || count <= 0) return;

    const slides = el.querySelectorAll<HTMLElement>("[data-swipe-slide]");
    if (slides.length === 0) return;

    const center = el.scrollLeft + el.clientWidth / 2;
    let closest = 0;
    let minDist = Infinity;

    slides.forEach((slide, i) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const dist = Math.abs(center - slideCenter);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });

    if (closest !== activeIndex) {
      onIndexChange(closest);
    }
  }, [activeIndex, count, onIndexChange]);

  const onScroll = useCallback(() => {
    if (programmaticScroll.current) return;
    if (scrollRaf.current !== null) return;
    scrollRaf.current = window.requestAnimationFrame(() => {
      scrollRaf.current = null;
      syncIndexFromScroll();
    });
  }, [syncIndexFromScroll]);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;

    const onScrollEnd = () => {
      programmaticScroll.current = false;
      syncIndexFromScroll();
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", onScrollEnd);

    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", onScrollEnd);
      if (scrollRaf.current !== null) {
        window.cancelAnimationFrame(scrollRaf.current);
      }
    };
  }, [onScroll, syncIndexFromScroll]);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;

    const slide = el.querySelectorAll<HTMLElement>("[data-swipe-slide]")[activeIndex];
    if (!slide) return;

    const targetLeft = slide.offsetLeft - (el.clientWidth - slide.offsetWidth) / 2;
    if (Math.abs(el.scrollLeft - targetLeft) < 4) return;

    programmaticScroll.current = true;
    el.scrollTo({ left: targetLeft, behavior: "smooth" });
    const t = window.setTimeout(() => {
      programmaticScroll.current = false;
    }, 400);
    return () => window.clearTimeout(t);
  }, [activeIndex]);

  const scrollToIndex = (i: number) => {
    onIndexChange(i);
  };

  const childArray = Children.toArray(children);

  return (
    <div className={className}>
      {showHint && count > 1 ? (
        <p className="mb-3 text-[10px] font-mono uppercase tracking-widest text-zinc-600 md:hidden">
          Swipe →
        </p>
      ) : null}

      <div
        ref={stripRef}
        className="swipe-strip -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory touch-pan-x md:mx-0 md:px-0"
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
      >
        {childArray.map((child, i) => (
          <div
            key={i}
            data-swipe-slide
            className={`swipe-slide shrink-0 snap-center ${slideClassName}`}
            style={{ width: "min(88vw, 340px)" }}
            aria-hidden={i !== activeIndex}
            aria-label={`Slide ${i + 1} of ${count}`}
          >
            {child}
          </div>
        ))}
      </div>

      {count > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3 md:hidden">
          <button
            type="button"
            onClick={() => scrollToIndex((activeIndex - 1 + count) % count)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
            aria-label="Previous slide"
          >
            ‹
          </button>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Slide indicators">
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => scrollToIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? "w-6 bg-[#FF4500]/85"
                    : "w-1.5 bg-white/15 hover:bg-white/30"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollToIndex((activeIndex + 1) % count)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
            aria-label="Next slide"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}

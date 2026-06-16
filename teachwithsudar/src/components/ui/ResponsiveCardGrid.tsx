"use client";

import { useState, type ReactNode } from "react";
import { SwipeCardStrip } from "@/components/ui/SwipeCardStrip";

type ResponsiveCardGridProps = {
  children: ReactNode[];
  gridClassName: string;
  ariaLabel?: string;
  showSwipeHint?: boolean;
  slideClassName?: string;
};

export function ResponsiveCardGrid({
  children,
  gridClassName,
  ariaLabel = "Cards",
  showSwipeHint = true,
  slideClassName = "",
}: ResponsiveCardGridProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const count = children.length;

  return (
    <>
      <div className="md:hidden">
        <SwipeCardStrip
          count={count}
          activeIndex={activeIndex}
          onIndexChange={setActiveIndex}
          ariaLabel={ariaLabel}
          showHint={showSwipeHint}
          slideClassName={slideClassName}
        >
          {children}
        </SwipeCardStrip>
      </div>
      <div className={`hidden md:grid ${gridClassName}`}>{children}</div>
    </>
  );
}

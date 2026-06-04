"use client";

import { useLayoutEffect } from "react";
import { destroyGsapLenis, initGsapLenis } from "@/lib/gsap-lenis";

export function GsapLenisProvider({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    initGsapLenis();
    return () => destroyGsapLenis();
  }, []);

  return <>{children}</>;
}

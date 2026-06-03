"use client";

import { useEffect } from "react";
import { destroyGsapLenis, initGsapLenis } from "@/lib/gsap-lenis";

export function GsapLenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initGsapLenis();
    return () => destroyGsapLenis();
  }, []);

  return <>{children}</>;
}

"use client";

import { useEffect } from "react";

const revealObserver = typeof window !== "undefined"
  ? new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("active");
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    )
  : null;

export function useReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!ref.current || !revealObserver) return;
    revealObserver.observe(ref.current);
    return () => ref.current && revealObserver.unobserve(ref.current);
  }, [ref]);
}

export function useRevealAll(selector: string) {
  useEffect(() => {
    if (typeof document === "undefined" || !revealObserver) return;
    const els = document.querySelectorAll(selector);
    els.forEach((el) => revealObserver.observe(el));
    return () => els.forEach((el) => revealObserver.unobserve(el));
  }, [selector]);
}

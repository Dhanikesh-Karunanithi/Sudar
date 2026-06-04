import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let lenisInstance: Lenis | null = null;
let rafCallback: ((time: number) => void) | null = null;

/** Initialize Lenis smooth scroll synced with GSAP ScrollTrigger. Call once on the client. */
export function initGsapLenis(): Lenis {
  if (lenisInstance) return lenisInstance;

  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: true,
  });

  lenis.on("scroll", ScrollTrigger.update);

  rafCallback = (time: number) => {
    lenis.raf(time * 1000);
  };
  gsap.ticker.add(rafCallback);
  gsap.ticker.lagSmoothing(0);

  lenisInstance = lenis;
  return lenis;
}

/** Tear down Lenis + GSAP ticker binding (e.g. on route unmount in SPA). */
export function destroyGsapLenis(): void {
  if (rafCallback) {
    gsap.ticker.remove(rafCallback);
    rafCallback = null;
  }
  lenisInstance?.destroy();
  lenisInstance = null;
}

export function getLenis(): Lenis | null {
  return lenisInstance;
}

/** Scroll offset for ScrollTrigger / hero logo flight (Lenis when active, else native). */
export function getScrollY(): number {
  const lenis = getLenis();
  if (lenis) return lenis.scroll;
  return window.scrollY;
}

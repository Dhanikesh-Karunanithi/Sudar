"use client";

import { useRef } from "react";
import { gsap } from "gsap";

export function AccessGate() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const handleHoverLeft = () => {
    if (window.innerWidth < 1024) return; // Disable on mobile
    gsap.to(leftRef.current, { flex: 1.8, duration: 0.6, ease: "power3.out" });
    gsap.to(rightRef.current, { flex: 1, duration: 0.6, ease: "power3.out" });
  };

  const handleHoverRight = () => {
    if (window.innerWidth < 1024) return; // Disable on mobile
    gsap.to(leftRef.current, { flex: 1, duration: 0.6, ease: "power3.out" });
    gsap.to(rightRef.current, { flex: 1.8, duration: 0.6, ease: "power3.out" });
  };

  const handleReset = () => {
    if (window.innerWidth < 1024) return; // Disable on mobile
    gsap.to([leftRef.current, rightRef.current], { flex: 1.4, duration: 0.6, ease: "power3.out" });
  };

  return (
    <section
      ref={containerRef}
      onMouseLeave={handleReset}
      className="relative z-10 flex flex-col lg:flex-row h-auto lg:h-screen w-full bg-[#050505] border-t border-white/5 overflow-hidden"
    >
      {/* Left Portal: Learner */}
      <div
        ref={leftRef}
        onMouseEnter={handleHoverLeft}
        className="flex-1 min-h-[50vh] lg:min-h-0 relative flex flex-col justify-center items-center px-8 py-16 text-center overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5 group transition-colors duration-500 hover:bg-indigo-950/10"
        style={{ flex: 1.4 }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />

        <div className="max-w-md relative z-10 flex flex-col items-center gap-6">
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 font-mono tracking-wider uppercase">
            Learner Portal
          </span>

          <h2 className="text-4xl md:text-6xl font-black text-white font-bricolage tracking-tight leading-tight">
            Sudar Learn
          </h2>

          <p className="text-foreground-muted font-light leading-relaxed">
            Enter your personal learning space. Experience courses across seven modalities, interact with your AI tutor, and track your cognitive twin.
          </p>

          <a
            href="https://learn.thesudar.com/login"
            className="group/btn relative inline-flex items-center justify-center px-8 py-4 rounded-full bg-indigo-600 text-white font-semibold text-base overflow-hidden transition-all duration-300 hover:bg-indigo-500 hover:shadow-[0_0_30px_rgba(94,90,215,0.3)] border border-indigo-500/30"
          >
            <span className="relative z-10 flex items-center gap-2">
              Enter Learn Space
              <svg
                className="w-5 h-5 transform transition-transform duration-300 group-hover/btn:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </span>
          </a>
        </div>
      </div>

      {/* Right Portal: Creator */}
      <div
        ref={rightRef}
        onMouseEnter={handleHoverRight}
        className="flex-1 min-h-[50vh] lg:min-h-0 relative flex flex-col justify-center items-center px-8 py-16 text-center overflow-hidden group transition-colors duration-500 hover:bg-primary/5"
        style={{ flex: 1.4 }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="max-w-md relative z-10 flex flex-col items-center gap-6">
          <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-mono tracking-wider uppercase">
            Creator Portal
          </span>

          <h2 className="text-4xl md:text-6xl font-black text-white font-bricolage tracking-tight leading-tight">
            Sudar Studio
          </h2>

          <p className="text-foreground-muted font-light leading-relaxed">
            Create, manage, and distribute world-class interactive training. Generate courses from documents and manage organizational learning paths.
          </p>

          <a
            href="https://studio.thesudar.com/login"
            className="group/btn relative inline-flex items-center justify-center px-8 py-4 rounded-full bg-primary text-white font-semibold text-base overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,69,0,0.3)] border border-primary"
          >
            <span className="relative z-10 flex items-center gap-2">
              Enter Studio Space
              <svg
                className="w-5 h-5 transform transition-transform duration-300 group-hover/btn:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

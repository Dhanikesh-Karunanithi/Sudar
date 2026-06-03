"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";
import { HeroCanvas } from "./HeroCanvas";

export function HeroCinematic() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const footnoteRef = useRef<HTMLDivElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!headlineRef.current || !subRef.current) return;

    // Split text into chars and words
    const splitHeadline = new SplitType(headlineRef.current, { types: "chars,words" });
    const splitSub = new SplitType(subRef.current, { types: "words" });

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    // Initial state
    gsap.set([splitHeadline.chars, splitSub.words, ctaRef.current, footnoteRef.current], {
      opacity: 0,
      y: 30,
    });

    // Animate headline character-by-character
    tl.to(splitHeadline.chars, {
      opacity: 1,
      y: 0,
      stagger: 0.03,
      duration: 0.8,
    })
    // Animate sub-copy word-by-word
    .to(
      splitSub.words,
      {
        opacity: 1,
        y: 0,
        stagger: 0.015,
        duration: 0.6,
      },
      "-=0.4"
    )
    // Animate CTAs
    .to(
      ctaRef.current,
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
      },
      "-=0.3"
    )
    // Animate footnote
    .to(
      footnoteRef.current,
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
      },
      "-=0.4"
    );

    // Magnetic button effect for CTAs
    const buttons = containerRef.current?.querySelectorAll(".magnetic-btn");
    const handleMouseMove = (e: MouseEvent, btn: HTMLElement) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(btn, {
        x: x * 0.25,
        y: y * 0.25,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = (btn: HTMLElement) => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.4,
        ease: "elastic.out(1, 0.3)",
      });
    };

    buttons?.forEach((btnNode) => {
      const btn = btnNode as HTMLElement;
      btn.addEventListener("mousemove", (e) => handleMouseMove(e, btn));
      btn.addEventListener("mouseleave", () => handleMouseLeave(btn));
    });

    // Fade scroll cue after user scrolls past hero
    if (scrollCueRef.current) {
      gsap.to(scrollCueRef.current, {
        opacity: 0,
        y: 12,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=120",
          scrub: true,
        },
      });
    }

    return () => {
      splitHeadline.revert();
      splitSub.revert();
      buttons?.forEach((btnNode) => {
        const btn = btnNode as HTMLElement;
        btn.removeEventListener("mousemove", (e) => handleMouseMove(e, btn));
        btn.removeEventListener("mouseleave", () => handleMouseLeave(btn));
      });
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden z-10"
    >
      <HeroCanvas />

      <div className="max-w-4xl mx-auto relative z-10">
        <h1
          ref={headlineRef}
          className="text-5xl md:text-8xl font-black tracking-tight text-white mb-6 font-bricolage leading-[1.1]"
        >
          Learns with you, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500 italic font-serif font-light">
            for you.
          </span>
        </h1>

        <p
          ref={subRef}
          className="text-lg md:text-2xl text-foreground-muted max-w-2xl mx-auto mb-12 font-light leading-relaxed text-balance"
        >
          Sudar is the world&apos;s first AI-native Learning Operating System. Enter your space below to begin.
        </p>

        <div
          ref={ctaRef}
          className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
        >
          <a
            href="https://learn.thesudar.com/login"
            className="magnetic-btn group relative inline-flex items-center justify-center px-8 py-4 rounded-full bg-primary text-white font-medium text-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,69,0,0.3)] border border-primary"
          >
            <span className="relative z-10 flex items-center gap-2">
              Open Sudar Learn
              <svg
                className="w-5 h-5 transform transition-transform duration-300 group-hover:translate-x-1"
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

          <a
            href="https://studio.thesudar.com/login"
            className="magnetic-btn group relative inline-flex items-center justify-center px-8 py-4 rounded-full bg-transparent text-white font-medium text-lg overflow-hidden transition-all duration-300 hover:bg-white/5 border border-white/20"
          >
            <span className="relative z-10 flex items-center gap-2">
              Open Sudar Studio
              <svg
                className="w-5 h-5 transform transition-transform duration-300 group-hover:translate-x-1"
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

        <div
          ref={footnoteRef}
          className="text-sm text-foreground-muted/60"
        >
          New to Sudar? Read research, guides, and docs at{" "}
          <a
            href="https://teachwithsudar.com/features"
            className="text-primary hover:underline transition-colors font-medium"
          >
            teachwithsudar.com →
          </a>
        </div>
      </div>

      {/* Scroll indicator — fades on scroll via GSAP ScrollTrigger */}
      <div
        ref={scrollCueRef}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-foreground-muted/40 text-xs tracking-widest uppercase font-mono select-none"
      >
        <span>Scroll to Explore</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-foreground-muted/40 to-transparent origin-top animate-pulse" />
      </div>
    </section>
  );
}

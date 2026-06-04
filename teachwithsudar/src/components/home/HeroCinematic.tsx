"use client";

import { useEffect, useRef } from "react";
import { motion, useTransform } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GatewayCta } from "@/components/gateway/GatewayCta";
import { GatewayHeadline } from "@/components/gateway/GatewayHeadline";
import { SudarLogoMotion } from "@/components/gateway/SudarLogoMotion";
import { SudarLogoMark } from "@/components/brand/SudarLogoMark";
import { HeroScrollAnimatedLogo } from "@/components/home/HeroScrollAnimatedLogo";
import { useHeroLogoScroll } from "@/hooks/useHeroLogoScroll";

export function HeroCinematic() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);
  const { active: scrollLogoActive, progress } = useHeroLogoScroll(true);
  /** Hide in-hero mark once the floating clone takes over (same handoff as marketing hero). */
  const heroLogoOpacity = useTransform(progress, [0, 0.06], [1, 0]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !contentRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(contentRef.current, { opacity: 0, y: 24, duration: 0.8 })
      .from(visualRef.current, { opacity: 0, scale: 0.96, duration: 0.9 }, "-=0.5");

    if (scrollCueRef.current) {
      gsap.to(scrollCueRef.current, {
        opacity: 0,
        y: 8,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=100",
          scrub: true,
        },
      });
    }

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[calc(100vh-var(--site-header-offset))] flex items-center overflow-hidden z-10 bg-black"
    >
      <HeroScrollAnimatedLogo />
      <div className="max-w-content-wide mx-auto w-full px-6 py-16 md:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div ref={contentRef} className="lg:col-span-5 flex flex-col gap-8 text-left">
            <GatewayHeadline as="h1" accent="for you." accentStyle="word" accentOnNewLine>
              Learns with you,
            </GatewayHeadline>

            <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-lg">
              Sudar is the world&apos;s first AI-native Learning Operating System. Enter your space below to begin.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <GatewayCta href="https://learn.thesudar.com/login">Open Sudar Learn</GatewayCta>
              <GatewayCta href="https://studio.thesudar.com/login" variant="secondary">
                Open Sudar Studio
              </GatewayCta>
            </div>

            <p className="text-sm text-[var(--text-secondary)]/80">
              New to Sudar? Read research, guides, and docs at{" "}
              <a
                href="https://teachwithsudar.com/features"
                className="text-[var(--brand-accent)] hover:underline font-medium"
              >
                teachwithsudar.com →
              </a>
            </p>
          </div>

          <div ref={visualRef} className="lg:col-span-7 flex items-center justify-center">
            <div className="relative w-full max-w-xl lg:max-w-2xl px-2 sm:px-4">
              <div className="motion-reduce:hidden">
                <motion.div
                  style={
                    scrollLogoActive ? { opacity: heroLogoOpacity } : undefined
                  }
                >
                  <SudarLogoMotion canvasId="hero-logo-anchor" />
                </motion.div>
              </div>
              <div className="hidden motion-reduce:flex justify-center py-12">
                <SudarLogoMark size={220} variant="on-dark" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={scrollCueRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--text-secondary)]/50 text-xs tracking-widest uppercase font-medium select-none"
      >
        <span>Scroll to explore</span>
        <div className="w-px h-10 bg-gradient-to-b from-[var(--text-secondary)]/40 to-transparent" />
      </div>
    </section>
  );
}

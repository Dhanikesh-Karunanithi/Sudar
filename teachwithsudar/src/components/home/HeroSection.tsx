"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { STUDIO_APP_URL, GITHUB_URL } from "@/lib/site-nav";

function useCurrentTime() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const format = () => {
      const now = new Date();
      let h = now.getHours();
      const m = now.getMinutes().toString().padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setTime(`${h}:${m} ${ampm}`);
    };
    format();
    const id = setInterval(format, 60000);
    return () => clearInterval(id);
  }, []);

  return time;
}

export function HeroSection() {
  const currentTime = useCurrentTime();

  return (
    <section
      className="relative flex min-h-[calc(100dvh_-_var(--site-header-offset))] flex-col items-center justify-start overflow-hidden bg-[#050505] pb-20"
      aria-label="Hero — Sudar"
    >
      {/* Atmospheric glow layers */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
        <div
          className="hero-glow absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] blur-[140px] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse, rgba(255,69,0,0.22) 0%, rgba(255,120,50,0.08) 45%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-[30%] left-[15%] w-[300px] h-[300px] blur-[100px] opacity-10 rounded-full"
          style={{ background: "radial-gradient(circle, #FF4500, transparent)" }}
        />
        <div
          className="absolute top-[20%] right-[10%] w-[200px] h-[200px] blur-[80px] opacity-[0.07] rounded-full"
          style={{ background: "radial-gradient(circle, #FF7A45, transparent)" }}
        />
      </div>

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
        aria-hidden
      />

      {/* Gradient fade at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, #050505)" }}
        aria-hidden
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 w-full max-w-5xl mx-auto">

        {/* Eyebrow badge */}
        <div
          className="fade-up mb-8"
          style={{ animationDelay: "0ms" }}
        >
          <span className="inline-flex items-center gap-2 text-[11px] text-[#FF4500]/70 font-medium tracking-widest uppercase border border-[#FF4500]/20 bg-[#FF4500]/[0.06] px-4 py-1.5 rounded-full backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500] opacity-80 animate-pulse" />
            AI-Native Learning Operating System
          </span>
        </div>

        {/* Headline */}
        <h1
          className="fade-up text-[clamp(2.8rem,8vw,6rem)] font-serif font-medium leading-[1.05] tracking-tight text-white mb-6 text-balance"
          style={{ animationDelay: "150ms" }}
        >
          The learning platform
          <br />
          <em className="font-light text-white/60 not-italic">
            that actually learns.
          </em>
        </h1>

        {/* Subheadline */}
        <p
          className="fade-up text-base sm:text-lg md:text-[1.2rem] text-zinc-400 font-light leading-relaxed max-w-2xl mb-10 text-balance"
          style={{ animationDelay: "300ms" }}
        >
          Sudar is the open-source adaptive learning OS for the modern enterprise.
          Author courses in minutes. Adapt to every individual.
          An AI tutor — named Sudar — that remembers every learner, session after session.
        </p>

        {/* Trust badges */}
        <div
          className="fade-up flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-12 text-[10px] text-zinc-500 uppercase tracking-wider font-mono"
          style={{ animationDelay: "450ms" }}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
            Open Source
          </span>
          <span className="hidden sm:block w-px h-3 bg-white/10" />
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400/80" />
            Apache 2.0
          </span>
          <span className="hidden sm:block w-px h-3 bg-white/10" />
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
            Self-Hostable
          </span>
          <span className="hidden sm:block w-px h-3 bg-white/10" />
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400/80" />
            Academic-Grade
          </span>
        </div>

        {/* CTA buttons */}
        <div
          className="fade-up flex flex-col sm:flex-row items-center gap-4"
          style={{ animationDelay: "600ms" }}
        >
          <a
            href={STUDIO_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 bg-[#FF4500] hover:bg-[#FF5722] text-white font-medium px-8 py-3.5 rounded-full transition-all duration-300 text-sm tracking-wide shadow-[0_0_32px_rgba(255,69,0,0.35)] hover:shadow-[0_0_48px_rgba(255,69,0,0.55)]"
          >
            Try Sudar Studio — free
            <svg
              className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 text-white/55 hover:text-white/90 border border-white/[0.09] hover:border-white/20 px-8 py-3.5 rounded-full transition-all duration-300 text-sm tracking-wide backdrop-blur-sm"
          >
            <svg className="w-4 h-4 opacity-70" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            View on GitHub
          </a>
        </div>

        {/* Research link */}
        <div
          className="fade-up mt-6"
          style={{ animationDelay: "750ms" }}
        >
          <Link
            href="/research"
            className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors duration-200 tracking-widest uppercase font-mono underline-offset-4 hover:underline"
          >
            Built on 60+ years of learning science →
          </Link>
        </div>

        {/* Ambient clock */}
        <div
          className="fade-up mt-16 flex items-center gap-4 text-[9px] text-white/15 uppercase tracking-[0.35em] font-mono"
          style={{ animationDelay: "900ms" }}
        >
          <span>{currentTime}</span>
          <span className="w-px h-2.5 bg-white/10" />
          <span>Teach with Sudar</span>
          <span className="w-px h-2.5 bg-white/10" />
          <span>teachwithsudar.com</span>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none" aria-hidden>
        <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent animate-pulse" />
      </div>
    </section>
  );
}

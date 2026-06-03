"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const signals = [
  {
    title: "Modality Preferences",
    desc: "Dynamically shifts scores for text, video, audio, mindmaps, and flashcards based on engagement depth.",
    icon: (
      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    title: "Behavioral Telemetry",
    desc: "Analyzes passive signals like pause rates, video replays, reading speed, and scrolling patterns.",
    icon: (
      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    title: "Dynamic Skill Graph",
    desc: "Maps conceptual mastery and knowledge gaps in real-time, feeding the Next Best Action engine.",
    icon: (
      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  }
];

export function IntelligenceConstellation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const svg = svgRef.current;
    if (!svg) return;

    const lines = svg.querySelectorAll(".constellation-line");
    const nodes = svg.querySelectorAll(".constellation-node");
    const labels = svg.querySelectorAll(".constellation-label");
    const centerNode = svg.querySelector(".center-node");
    const centerPulse = svg.querySelector(".center-pulse");

    // Set initial states
    gsap.set(lines, { strokeDasharray: 1000, strokeDashoffset: 1000 });
    gsap.set(nodes, { scale: 0, opacity: 0, transformOrigin: "center" });
    gsap.set(labels, { opacity: 0, y: 10 });
    gsap.set(centerNode, { scale: 0, opacity: 0, transformOrigin: "center" });
    gsap.set(centerPulse, { scale: 0, opacity: 0, transformOrigin: "center" });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 70%",
        end: "bottom 30%",
        toggleActions: "play none none reverse",
      },
    });

    tl.to(centerNode, {
      scale: 1,
      opacity: 1,
      duration: 0.6,
      ease: "back.out(1.7)",
    })
    .to(centerPulse, {
      scale: 1,
      opacity: 0.4,
      duration: 0.4,
    }, "-=0.3")
    .to(lines, {
      strokeDashoffset: 0,
      duration: 1.2,
      stagger: 0.08,
      ease: "power2.out",
    }, "-=0.2")
    .to(nodes, {
      scale: 1,
      opacity: 1,
      duration: 0.5,
      stagger: 0.06,
      ease: "back.out(1.5)",
    }, "-=1.0")
    .to(labels, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      stagger: 0.06,
      ease: "power2.out",
    }, "-=0.6");

    // Continuous subtle pulsing on center node
    gsap.to(centerPulse, {
      scale: 1.8,
      opacity: 0,
      duration: 2,
      repeat: -1,
      ease: "power1.out",
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === containerRef.current) t.kill();
      });
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative z-10 py-24 md:py-36 bg-[#050505] border-t border-white/5 overflow-hidden"
    >
      <div className="max-w-content-wide mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        {/* Left: Copy */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div>
            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-mono tracking-wider uppercase">
              Digital Learner Twin
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-white font-bricolage tracking-tight leading-tight">
            Sudar learns <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500 italic font-serif font-light">
              you.
            </span>
          </h2>

          <p className="text-foreground-muted font-light leading-relaxed text-lg">
            Every interaction—replays, pauses, quiz scores, and cognitive pace—silently feeds a secure, private Digital Learner Twin. The system adapts entirely to your needs, without you ever lifting a finger.
          </p>

          <div className="flex flex-col gap-6 mt-2">
            {signals.map((sig) => (
              <div key={sig.title} className="flex gap-4 items-start">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 shrink-0 mt-1">
                  {sig.icon}
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">{sig.title}</h4>
                  <p className="text-foreground-muted text-sm font-light leading-relaxed">{sig.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: SVG Constellation */}
        <div className="lg:col-span-7 flex justify-center items-center">
          <div className="relative w-full max-w-[500px] aspect-square rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent backdrop-blur-sm p-4 flex items-center justify-center">
            <svg
              ref={svgRef}
              viewBox="0 0 500 500"
              className="w-full h-full"
            >
              {/* Lines from center (250, 250) to nodes */}
              <line x1="250" y1="250" x2="120" y2="130" className="constellation-line stroke-indigo-500/30 stroke-[1.5]" />
              <line x1="250" y1="250" x2="380" y2="100" className="constellation-line stroke-primary/30 stroke-[1.5]" />
              <line x1="250" y1="250" x2="430" y2="240" className="constellation-line stroke-violet-500/30 stroke-[1.5]" />
              <line x1="250" y1="250" x2="350" y2="400" className="constellation-line stroke-indigo-500/30 stroke-[1.5]" />
              <line x1="250" y1="250" x2="150" y2="390" className="constellation-line stroke-primary/30 stroke-[1.5]" />
              <line x1="250" y1="250" x2="70" y2="270" className="constellation-line stroke-violet-500/30 stroke-[1.5]" />

              {/* Inter-node lines */}
              <line x1="120" y1="130" x2="380" y2="100" className="constellation-line stroke-white/5 stroke-[1] stroke-dasharray-[4,4]" />
              <line x1="380" y1="100" x2="430" y2="240" className="constellation-line stroke-white/5 stroke-[1] stroke-dasharray-[4,4]" />
              <line x1="430" y1="240" x2="350" y2="400" className="constellation-line stroke-white/5 stroke-[1] stroke-dasharray-[4,4]" />
              <line x1="350" y1="400" x2="150" y2="390" className="constellation-line stroke-white/5 stroke-[1] stroke-dasharray-[4,4]" />
              <line x1="150" y1="390" x2="70" y2="270" className="constellation-line stroke-white/5 stroke-[1] stroke-dasharray-[4,4]" />
              <line x1="70" y1="270" x2="120" y2="130" className="constellation-line stroke-white/5 stroke-[1] stroke-dasharray-[4,4]" />

              {/* Center Node (Pulsing core) */}
              <circle cx="250" cy="250" r="24" className="center-pulse fill-primary/20" />
              <circle cx="250" cy="250" r="14" className="center-node fill-primary stroke-white/10 stroke-[2]" />
              <text x="250" y="254" textAnchor="middle" className="center-node fill-white font-mono text-[9px] font-bold pointer-events-none">TWIN</text>

              {/* Outer Nodes */}
              {/* Node 1: Visual Score */}
              <circle cx="120" cy="130" r="8" className="constellation-node fill-indigo-500 stroke-white/10 stroke-[1.5]" />
              <text x="120" y="110" textAnchor="middle" className="constellation-label fill-white/80 font-mono text-[10px] font-medium">Visual Pace</text>

              {/* Node 2: Audio Score */}
              <circle cx="380" cy="100" r="8" className="constellation-node fill-primary stroke-white/10 stroke-[1.5]" />
              <text x="380" y="80" textAnchor="middle" className="constellation-label fill-white/80 font-mono text-[10px] font-medium">Audio Depth</text>

              {/* Node 3: Memory Retention */}
              <circle cx="430" cy="240" r="8" className="constellation-node fill-violet-500 stroke-white/10 stroke-[1.5]" />
              <text x="430" y="220" textAnchor="start" className="constellation-label fill-white/80 font-mono text-[10px] font-medium">  Memory</text>

              {/* Node 4: Focus Duration */}
              <circle cx="350" cy="400" r="8" className="constellation-node fill-indigo-500 stroke-white/10 stroke-[1.5]" />
              <text x="350" y="425" textAnchor="middle" className="constellation-label fill-white/80 font-mono text-[10px] font-medium">Focus Span</text>

              {/* Node 5: Concept Gaps */}
              <circle cx="150" cy="390" r="8" className="constellation-node fill-primary stroke-white/10 stroke-[1.5]" />
              <text x="150" y="415" textAnchor="middle" className="constellation-label fill-white/80 font-mono text-[10px] font-medium">Concept Gaps</text>

              {/* Node 6: Pace Delta */}
              <circle cx="70" cy="270" r="8" className="constellation-node fill-violet-500 stroke-white/10 stroke-[1.5]" />
              <text x="60" y="274" textAnchor="end" className="constellation-label fill-white/80 font-mono text-[10px] font-medium">Pace Delta  </text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

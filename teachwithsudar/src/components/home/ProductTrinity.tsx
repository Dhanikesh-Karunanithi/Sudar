"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const products = [
  {
    id: "learn",
    name: "Sudar Learn",
    tagline: "The Learner's Companion",
    description: "An immersive, adaptive space that delivers content in any modality—text, video, audio, mindmaps, or flashcards—tailored to your cognitive pace.",
    color: "from-indigo-500/20 to-indigo-500/5",
    borderColor: "border-indigo-500/20",
    glowColor: "rgba(94, 90, 215, 0.15)",
    badge: "For Learners",
    features: ["7 Modalities in 1 Click", "Longitudinal Memory Tutor", "Digital Learner Twin Tracking"],
    ctaUrl: "https://learn.thesudar.com/login",
    mockup: (
      <div className="relative w-full h-full rounded-2xl border border-indigo-500/20 bg-black/40 backdrop-blur-md p-6 flex flex-col justify-between overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/40" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
            <div className="w-3 h-3 rounded-full bg-green-500/40" />
          </div>
          <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-mono">
            learn.thesudar.com
          </div>
        </div>
        <div className="flex-1 py-6 flex flex-col gap-4">
          <div className="h-4 w-2/3 bg-white/10 rounded animate-pulse" />
          <div className="h-24 w-full bg-white/5 rounded-lg border border-white/5 p-4 flex flex-col gap-2">
            <div className="h-3 w-full bg-white/10 rounded" />
            <div className="h-3 w-5/6 bg-white/10 rounded" />
            <div className="h-3 w-4/5 bg-white/10 rounded" />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {["Text", "Video", "Audio", "MindMap", "Cards"].map((m, idx) => (
              <div key={m} className={`h-8 rounded flex items-center justify-center text-[10px] font-mono border ${idx === 0 ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'bg-white/5 border-white/5 text-white/40'}`}>
                {m}
              </div>
            ))}
          </div>
        </div>
        <div className="h-10 w-full bg-indigo-600/20 border border-indigo-500/30 rounded-lg flex items-center justify-center text-xs text-indigo-300 font-medium">
          Adaptive Session Active
        </div>
      </div>
    )
  },
  {
    id: "studio",
    name: "Sudar Studio",
    tagline: "The Creator's Engine",
    description: "Democratize instructional design. Author once, deploy everywhere. Generate beautiful, pedagogically sound courses from documents or prompts in seconds.",
    color: "from-primary/20 to-primary/5",
    borderColor: "border-primary/20",
    glowColor: "rgba(255, 69, 0, 0.15)",
    badge: "For Creators & L&D",
    features: ["Document-to-Course AI", "14 Premium Visual Templates", "Enterprise Governance & Audit"],
    ctaUrl: "https://studio.thesudar.com/login",
    mockup: (
      <div className="relative w-full h-full rounded-2xl border border-primary/20 bg-black/40 backdrop-blur-md p-6 flex flex-col justify-between overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/40" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
            <div className="w-3 h-3 rounded-full bg-green-500/40" />
          </div>
          <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] text-primary font-mono">
            studio.thesudar.com
          </div>
        </div>
        <div className="flex-1 py-6 flex flex-col gap-4">
          <div className="h-4 w-1/2 bg-white/10 rounded animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-16 rounded bg-white/5 border border-white/5 p-2 flex flex-col justify-between">
              <div className="w-4 h-4 rounded bg-primary/20" />
              <div className="h-2 w-2/3 bg-white/10 rounded" />
            </div>
            <div className="h-16 rounded bg-white/5 border border-white/5 p-2 flex flex-col justify-between">
              <div className="w-4 h-4 rounded bg-white/10" />
              <div className="h-2 w-1/2 bg-white/10 rounded" />
            </div>
            <div className="h-16 rounded bg-white/5 border border-white/5 p-2 flex flex-col justify-between">
              <div className="w-4 h-4 rounded bg-white/10" />
              <div className="h-2 w-3/4 bg-white/10 rounded" />
            </div>
          </div>
          <div className="h-12 w-full bg-white/5 border border-white/5 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              <span className="text-[10px] text-white/60 font-mono">AI Generation Progress</span>
            </div>
            <span className="text-[10px] text-primary font-mono font-bold">84%</span>
          </div>
        </div>
        <div className="h-10 w-full bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center text-xs text-primary font-medium">
          Publish Course to Learn
        </div>
      </div>
    )
  },
  {
    id: "intelligence",
    name: "Sudar Intelligence",
    tagline: "The Cognitive Core",
    description: "The background engine powering both Learn and Studio. Orchestrates RAG, compiles adaptive paths, and drives the longitudinal tutor memory.",
    color: "from-violet-500/20 to-violet-500/5",
    borderColor: "border-violet-500/20",
    glowColor: "rgba(139, 92, 246, 0.15)",
    badge: "The AI Engine",
    features: ["Adaptive Next-Best-Action", "Longitudinal Memory Cadence", "Multilingual RAG & TTS"],
    ctaUrl: "https://learn.thesudar.com/login",
    mockup: (
      <div className="relative w-full h-full rounded-2xl border border-violet-500/20 bg-black/40 backdrop-blur-md p-6 flex flex-col justify-between overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/40" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
            <div className="w-3 h-3 rounded-full bg-green-500/40" />
          </div>
          <div className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-400 font-mono">
            intelligence.thesudar.com
          </div>
        </div>
        <div className="flex-1 py-6 flex flex-col justify-center">
          <div className="relative flex items-center justify-center h-28">
            <div className="absolute w-24 h-24 rounded-full border border-violet-500/30 animate-spin" style={{ animationDuration: "10s" }} />
            <div className="absolute w-16 h-16 rounded-full border border-dashed border-violet-400/40 animate-spin" style={{ animationDuration: "5s", animationDirection: "reverse" }} />
            <div className="absolute w-8 h-8 rounded-full bg-violet-500/30 flex items-center justify-center text-violet-300 font-mono text-xs font-bold">
              AI
            </div>
          </div>
          <div className="text-center mt-4">
            <div className="text-[10px] text-violet-400 font-mono uppercase tracking-widest">Cognitive Load Optimizer</div>
            <div className="text-[11px] text-white/60 mt-1">Analyzing learner twin telemetry...</div>
          </div>
        </div>
        <div className="h-10 w-full bg-violet-600/20 border border-violet-500/30 rounded-lg flex items-center justify-center text-xs text-violet-300 font-medium">
          Neural Gateway Online
        </div>
      </div>
    )
  }
];

export function ProductTrinity() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const trigger = triggerRef.current;
    if (!section || !trigger) return;

    // Check if mobile
    const isMobile = window.matchMedia("(max-width: 1024px)").matches;

    if (!isMobile) {
      const pin = gsap.fromTo(
        section,
        { x: 0 },
        {
          x: "-200vw",
          ease: "none",
          scrollTrigger: {
            trigger: trigger,
            pin: true,
            scrub: 1,
            start: "top top",
            end: () => `+=${trigger.offsetWidth}`,
            invalidateOnRefresh: true,
          },
        }
      );

      return () => {
        pin.scrollTrigger?.kill();
      };
    }

    const cards = trigger.querySelectorAll("[data-product-card]");
    gsap.set(cards, { opacity: 0, y: 40 });
    const mobileReveal = gsap.to(cards, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      stagger: 0.15,
      ease: "power3.out",
      scrollTrigger: {
        trigger,
        start: "top 80%",
        toggleActions: "play none none reverse",
      },
    });

    return () => {
      mobileReveal.scrollTrigger?.kill();
    };
  }, []);

  return (
    <div ref={triggerRef} className="relative z-10 bg-[#050505] overflow-hidden">
      {/* Desktop Horizontal Scroll */}
      <div className="hidden lg:block">
        <div ref={sectionRef} className="flex w-[300vw] h-screen">
          {products.map((product) => (
            <section
              key={product.id}
              className="w-screen h-screen flex items-center justify-center px-12 relative overflow-hidden"
            >
              {/* Background ambient glow */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
                style={{
                  background: `radial-gradient(circle at 60% 50%, ${product.glowColor} 0%, rgba(5,5,5,0) 60%)`,
                }}
              />

              <div className="max-w-content-wide mx-auto w-full grid grid-cols-12 gap-12 items-center relative z-10">
                {/* Left: Copy */}
                <div className="col-span-5 flex flex-col gap-6">
                  <div>
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-foreground-muted font-mono tracking-wider uppercase">
                      {product.badge}
                    </span>
                  </div>

                  <h2 className="text-5xl font-black text-white font-bricolage tracking-tight">
                    {product.name}
                  </h2>

                  <h3 className="text-xl text-primary font-serif italic">
                    {product.tagline}
                  </h3>

                  <p className="text-foreground-muted font-light leading-relaxed">
                    {product.description}
                  </p>

                  <ul className="flex flex-col gap-3 my-2">
                    {product.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-3 text-sm text-white/80">
                        <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <div>
                    <a
                      href={product.ctaUrl}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold text-sm transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-[0_0_20px_rgba(255,69,0,0.2)]"
                    >
                      Access {product.name}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Right: Premium Mockup */}
                <div className="col-span-7 h-[500px] flex items-center justify-center pl-12">
                  <div className="w-full max-w-[580px] h-[400px] relative">
                    {product.mockup}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Mobile Stacked Layout */}
      <div className="block lg:hidden py-24 px-6 flex flex-col gap-24">
        {products.map((product) => (
          <section
            key={product.id}
            data-product-card
            className="flex flex-col gap-8 relative overflow-hidden"
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${product.glowColor} 0%, rgba(5,5,5,0) 80%)`,
              }}
            />

            <div className="flex flex-col gap-4 relative z-10">
              <div>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-foreground-muted font-mono tracking-wider uppercase">
                  {product.badge}
                </span>
              </div>

              <h2 className="text-4xl font-black text-white font-bricolage tracking-tight">
                {product.name}
              </h2>

              <h3 className="text-lg text-primary font-serif italic">
                {product.tagline}
              </h3>

              <p className="text-foreground-muted font-light leading-relaxed">
                {product.description}
              </p>

              <ul className="flex flex-col gap-3 my-2">
                {product.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-3 text-sm text-white/80">
                    <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>

              <div className="w-full h-[320px] my-6">
                {product.mockup}
              </div>

              <div>
                <a
                  href={product.ctaUrl}
                  className="inline-flex items-center justify-center w-full gap-2 px-6 py-4 rounded-full bg-white text-black font-semibold text-sm transition-all duration-300 hover:bg-primary hover:text-white"
                >
                  Access {product.name}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

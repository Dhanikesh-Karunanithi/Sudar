"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GatewayCta } from "@/components/gateway/GatewayCta";

const products = [
  {
    id: "learn",
    name: "Sudar Learn",
    tagline: "The learner's companion",
    description:
      "An immersive, adaptive space that delivers content in any modality—text, video, audio, mindmaps, or flashcards—tailored to your cognitive pace.",
    extraLink: {
      href: "https://teachwithsudar.com/modalities",
      label: "Explore all modalities on teachwithsudar.com",
    },
    glowColor: "rgba(94, 90, 215, 0.12)",
    badge: "For learners",
    features: ["7 modalities in 1 click", "Longitudinal memory tutor", "Digital Learner Twin tracking"],
    ctaUrl: "https://learn.thesudar.com/login",
    mockup: (
      <div className="relative w-full h-full rounded-2xl border border-brand-secondary/25 bg-[#0a0a0a] p-6 flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <span className="px-3 py-1 rounded-full bg-brand-secondary/10 border border-brand-secondary/25 text-[10px] text-brand-secondary font-mono">
            learn.thesudar.com
          </span>
        </div>
        <div className="flex-1 py-6 flex flex-col gap-4">
          <div className="h-4 w-2/3 bg-white/10 rounded" />
          <div className="h-24 w-full bg-white/5 rounded-lg border border-white/5 p-4 flex flex-col gap-2">
            <div className="h-3 w-full bg-white/10 rounded" />
            <div className="h-3 w-5/6 bg-white/10 rounded" />
            <div className="h-3 w-4/5 bg-white/10 rounded" />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {["Text", "Video", "Audio", "MindMap", "Cards"].map((m, idx) => (
              <div
                key={m}
                className={`h-8 rounded flex items-center justify-center text-[10px] font-mono border ${
                  idx === 0
                    ? "bg-brand-secondary/20 border-brand-secondary/40 text-brand-secondary"
                    : "bg-white/5 border-white/5 text-white/40"
                }`}
              >
                {m}
              </div>
            ))}
          </div>
        </div>
        <div className="h-10 w-full bg-brand-secondary/15 border border-brand-secondary/30 rounded-lg flex items-center justify-center text-xs text-brand-secondary font-medium">
          Adaptive session active
        </div>
      </div>
    ),
  },
  {
    id: "studio",
    name: "Sudar Studio",
    tagline: "The creator's engine",
    description:
      "Democratize instructional design. Author once, deploy everywhere. Generate beautiful, pedagogically sound courses from documents or prompts in seconds.",
    glowColor: "rgba(255, 122, 69, 0.1)",
    badge: "For creators & L&D",
    features: ["Document-to-course AI", "14 premium visual templates", "Enterprise governance & audit"],
    ctaUrl: "https://studio.thesudar.com/login",
    mockup: (
      <div className="relative w-full h-full rounded-2xl border border-[var(--brand-accent)]/25 bg-[#0a0a0a] p-6 flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <span className="px-3 py-1 rounded-full bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/25 text-[10px] text-[var(--brand-accent)] font-mono">
            studio.thesudar.com
          </span>
        </div>
        <div className="flex-1 py-6 flex flex-col gap-4">
          <div className="h-4 w-1/2 bg-white/10 rounded" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 rounded bg-white/5 border border-white/5 p-2 flex flex-col justify-between">
                <div className={`w-4 h-4 rounded ${n === 1 ? "bg-[var(--brand-accent)]/30" : "bg-white/10"}`} />
                <div className="h-2 w-2/3 bg-white/10 rounded" />
              </div>
            ))}
          </div>
          <div className="h-12 w-full bg-white/5 border border-white/5 rounded-lg p-3 flex items-center justify-between">
            <span className="text-[10px] text-white/60 font-mono">AI generation progress</span>
            <span className="text-[10px] text-[var(--brand-accent)] font-mono font-bold">84%</span>
          </div>
        </div>
        <div className="h-10 w-full bg-[var(--brand-accent)]/15 border border-[var(--brand-accent)]/30 rounded-lg flex items-center justify-center text-xs text-[var(--brand-accent)] font-medium">
          Publish course to Learn
        </div>
      </div>
    ),
  },
  {
    id: "intelligence",
    name: "Sudar Intelligence",
    tagline: "The cognitive core",
    description:
      "The background engine powering both Learn and Studio. Orchestrates RAG, compiles adaptive paths, and drives the longitudinal tutor memory.",
    glowColor: "rgba(94, 90, 215, 0.1)",
    badge: "The AI engine",
    features: ["Adaptive next-best-action", "Longitudinal memory cadence", "Multilingual RAG & TTS"],
    ctaUrl: "https://intelligence.thesudar.com/docs",
    mockup: (
      <div className="relative w-full h-full rounded-2xl border border-brand-secondary/25 bg-[#0a0a0a] p-6 flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <span className="px-3 py-1 rounded-full bg-brand-secondary/10 border border-brand-secondary/25 text-[10px] text-brand-secondary font-mono">
            intelligence.thesudar.com
          </span>
        </div>
        <div className="flex-1 py-6 flex flex-col justify-center">
          <div className="relative flex items-center justify-center h-28">
            <div
              className="absolute w-24 h-24 rounded-full border border-brand-secondary/30 animate-spin"
              style={{ animationDuration: "10s" }}
            />
            <div
              className="absolute w-16 h-16 rounded-full border border-dashed border-brand-secondary/40 animate-spin"
              style={{ animationDuration: "5s", animationDirection: "reverse" }}
            />
            <div className="absolute w-8 h-8 rounded-full bg-brand-secondary/30 flex items-center justify-center text-brand-secondary font-mono text-xs font-bold">
              AI
            </div>
          </div>
          <div className="text-center mt-4">
            <div className="text-[10px] text-brand-secondary font-mono uppercase tracking-widest">
              Cognitive load optimizer
            </div>
            <div className="text-[11px] text-white/60 mt-1">Analyzing learner twin telemetry…</div>
          </div>
        </div>
        <div className="h-10 w-full bg-brand-secondary/15 border border-brand-secondary/30 rounded-lg flex items-center justify-center text-xs text-brand-secondary font-medium">
          Neural gateway online
        </div>
      </div>
    ),
  },
];

export function ProductTrinity() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const trigger = triggerRef.current;
    if (!section || !trigger) return;

    const isMobile = window.matchMedia("(max-width: 1024px)").matches;

    if (!isMobile) {
      const pin = gsap.fromTo(
        section,
        { x: 0 },
        {
          x: "-200vw",
          ease: "none",
          scrollTrigger: {
            trigger,
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

  const ProductPanel = ({ product }: { product: (typeof products)[0] }) => (
    <section className="w-screen h-screen flex items-center justify-center px-6 sm:px-12 relative overflow-hidden bg-black">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 60% 50%, ${product.glowColor} 0%, transparent 60%)`,
        }}
      />
      <div className="max-w-content-wide mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        <div className="lg:col-span-5 flex flex-col gap-6">
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[var(--text-secondary)] font-mono tracking-wider uppercase w-fit">
            {product.badge}
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white tracking-tight">
            {product.name}
          </h2>
          <p className="text-[var(--brand-accent)] font-medium">{product.tagline}</p>
          <p className="text-[var(--text-secondary)] font-light leading-relaxed">{product.description}</p>
          {"extraLink" in product && product.extraLink ? (
            <a
              href={product.extraLink.href}
              className="text-sm text-brand-secondary hover:text-[var(--brand-accent)] transition-colors"
            >
              {product.extraLink.label} →
            </a>
          ) : null}
          <ul className="flex flex-col gap-3">
            {product.features.map((feat) => (
              <li key={feat} className="flex items-center gap-3 text-sm text-white/80">
                <svg className="w-5 h-5 text-[var(--brand-accent)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feat}
              </li>
            ))}
          </ul>
          <GatewayCta href={product.ctaUrl} className="w-fit">
            Access {product.name}
          </GatewayCta>
        </div>
        <div className="lg:col-span-7 h-[320px] sm:h-[400px] flex items-center justify-center">
          <div className="w-full max-w-[580px] h-full">{product.mockup}</div>
        </div>
      </div>
    </section>
  );

  return (
    <div ref={triggerRef} className="relative z-10 bg-black overflow-hidden">
      <div className="hidden lg:block">
        <div ref={sectionRef} className="flex w-[300vw] h-screen">
          {products.map((product) => (
            <ProductPanel key={product.id} product={product} />
          ))}
        </div>
      </div>

      <div className="block lg:hidden py-20 px-6 flex flex-col gap-20">
        {products.map((product) => (
          <article key={product.id} data-product-card className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                {product.badge}
              </span>
              <h2 className="text-3xl font-heading font-bold text-white">{product.name}</h2>
              <p className="text-[var(--brand-accent)]">{product.tagline}</p>
              <p className="text-[var(--text-secondary)] leading-relaxed">{product.description}</p>
              {"extraLink" in product && product.extraLink ? (
                <a href={product.extraLink.href} className="text-sm text-brand-secondary">
                  {product.extraLink.label} →
                </a>
              ) : null}
            </div>
            <div className="h-[300px]">{product.mockup}</div>
            <GatewayCta href={product.ctaUrl} className="w-full justify-center">
              Access {product.name}
            </GatewayCta>
          </article>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GatewaySection } from "@/components/gateway/GatewaySection";

const stats = [
  { value: 6, suffix: "", label: "Modalities shipped", desc: "Read, Listen, Watch, Podcast, Map, Cards" },
  { value: 30, suffix: "+", label: "Languages", desc: "Full-stack localization and multilingual TTS" },
  { value: 14, suffix: "", label: "Visual templates", desc: "Pedagogically sound Studio styles" },
  { value: 100, suffix: "%", label: "Adaptive", desc: "Real-time next-best-action engine" },
];

export function ImpactStrip() {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    counterRefs.current.forEach((ref, idx) => {
      if (!ref) return;
      const stat = stats[idx];
      const obj = { val: 0 };

      gsap.to(obj, {
        val: stat.value,
        duration: 1.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
        onUpdate: () => {
          ref.innerText = Math.floor(obj.val).toString();
        },
      });
    });
  }, []);

  return (
    <GatewaySection bordered className="py-16 md:py-20">
      <div ref={containerRef}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center mb-14">
          {stats.map((stat, idx) => (
            <div key={stat.label}>
              <div className="text-3xl md:text-5xl font-heading font-bold text-[var(--text-primary)] tracking-tight">
                <span
                  ref={(el) => {
                    counterRefs.current[idx] = el;
                  }}
                >
                  0
                </span>
                <span className="text-[var(--brand-accent)]">{stat.suffix}</span>
              </div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                {stat.label}
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-[180px] mx-auto leading-relaxed">
                {stat.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <blockquote className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 text-left">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              &ldquo;Sudar finally feels like a learning OS—not another LMS bolt-on. Our team ships in Studio and
              learners switch modalities without rebuilding content.&rdquo;
            </p>
            <footer className="mt-4 text-[11px] text-[var(--text-secondary)] uppercase tracking-wider">
              L&amp;D lead · Enterprise pilot
            </footer>
          </blockquote>
          <blockquote className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 text-left">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              &ldquo;The tutor remembers context across sessions. That longitudinal memory is the difference between a
              chatbot and a study buddy.&rdquo;
            </p>
            <footer className="mt-4 text-[11px] text-[var(--text-secondary)] uppercase tracking-wider">
              Instructional designer · Higher ed
            </footer>
          </blockquote>
        </div>
      </div>
    </GatewaySection>
  );
}

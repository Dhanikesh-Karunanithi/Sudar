"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

const NODES = [
  { id: "visual", cx: 120, cy: 130, label: "Visual pace", tone: "secondary" as const, metric: "0.82" },
  { id: "audio", cx: 380, cy: 100, label: "Audio depth", tone: "accent" as const, metric: "0.71" },
  { id: "memory", cx: 430, cy: 240, label: "Memory", tone: "secondary" as const, metric: "0.64" },
  { id: "focus", cx: 350, cy: 400, label: "Focus span", tone: "secondary" as const, metric: "0.58" },
  { id: "gaps", cx: 150, cy: 390, label: "Concept gaps", tone: "accent" as const, metric: "3 open" },
  { id: "pace", cx: 70, cy: 270, label: "Pace delta", tone: "secondary" as const, metric: "+12%" },
] as const;

type NodeId = (typeof NODES)[number]["id"];

const HUB = { cx: 250, cy: 250 };

function toneFill(tone: "secondary" | "accent", active: boolean) {
  if (tone === "accent") return active ? "var(--brand-accent)" : "color-mix(in srgb, var(--brand-accent) 85%, white)";
  return active ? "var(--brand-secondary)" : "color-mix(in srgb, var(--brand-secondary) 85%, white)";
}

export function LearnerTwinVisualization() {
  const uid = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeId, setActiveId] = useState<NodeId | null>(null);
  const reducedMotion = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), { stiffness: 120, damping: 22 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), { stiffness: 120, damping: 22 });
  const glowX = useSpring(useTransform(mx, [-0.5, 0.5], [35, 65]), { stiffness: 80, damping: 20 });
  const glowY = useSpring(useTransform(my, [-0.5, 0.5], [35, 65]), { stiffness: 80, damping: 20 });
  const spotlightBg = useTransform(
    [glowX, glowY],
    ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,122,69,0.12) 0%, transparent 42%)`
  );

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reducedMotion || !sceneRef.current) return;
      const rect = sceneRef.current.getBoundingClientRect();
      mx.set((e.clientX - rect.left) / rect.width - 0.5);
      my.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [mx, my, reducedMotion]
  );

  const onLeave = useCallback(() => {
    mx.set(0);
    my.set(0);
  }, [mx, my]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const svg = svgRef.current;
    if (!svg) return;

    const lines = svg.querySelectorAll(".twin-line");
    const nodes = svg.querySelectorAll(".twin-node-group");
    const labels = svg.querySelectorAll(".twin-label");
    const center = svg.querySelector(".twin-center");
    const pulse = svg.querySelector(".twin-pulse");
    const rings = svg.querySelectorAll(".twin-ring");
    const particles = svg.querySelectorAll(".twin-particle");

    const ctx = gsap.context(() => {
      gsap.set(lines, { strokeDasharray: 1000, strokeDashoffset: 1000 });
      gsap.set(nodes, { scale: 0, opacity: 0, transformOrigin: "center" });
      gsap.set(labels, { opacity: 0, y: 8 });
      gsap.set(center, { scale: 0, opacity: 0, transformOrigin: "center" });
      gsap.set(pulse, { scale: 0, opacity: 0, transformOrigin: "center" });
      gsap.set(rings, { opacity: 0, scale: 0.92, transformOrigin: "250px 250px" });
      gsap.set(particles, { opacity: 0, scale: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 72%",
          toggleActions: "play none none reverse",
        },
      });

      tl.to(center, { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(1.7)" })
        .to(pulse, { scale: 1, opacity: 0.4, duration: 0.35 }, "-=0.25")
        .to(rings, { opacity: 1, scale: 1, duration: 0.9, stagger: 0.12, ease: "power2.out" }, "-=0.2")
        .to(lines, { strokeDashoffset: 0, duration: 1.1, stagger: 0.06, ease: "power2.inOut" }, "-=0.5")
        .to(nodes, { scale: 1, opacity: 1, duration: 0.45, stagger: 0.08, ease: "back.out(1.4)" }, "-=0.75")
        .to(labels, { opacity: 1, y: 0, duration: 0.35, stagger: 0.06 }, "-=0.35")
        .to(particles, { opacity: 0.55, scale: 1, duration: 0.5, stagger: 0.03 }, "-=0.5");

      if (!reducedMotion) {
        gsap.to(pulse, {
          scale: 1.75,
          opacity: 0,
          duration: 2.2,
          repeat: -1,
          ease: "power1.out",
        });
        gsap.to(rings, {
          rotation: 360,
          duration: 48,
          repeat: -1,
          ease: "none",
          transformOrigin: "250px 250px",
          stagger: 0.4,
        });
        gsap.to(particles, {
          y: "+=18",
          opacity: 0.15,
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: { each: 0.35, from: "random" },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    NODES.forEach((node) => {
      const group = svg.querySelector(`[data-node="${node.id}"]`);
      const hubLine = svg.querySelector(`[data-link="${node.id}"]`);
      const isActive = activeId === node.id;
      const dimmed = activeId !== null && !isActive;

      gsap.to(group, {
        scale: isActive ? 1.35 : 1,
        duration: 0.35,
        ease: "back.out(2)",
      });
      if (hubLine) {
        gsap.to(hubLine, {
          strokeOpacity: isActive ? 0.95 : dimmed ? 0.15 : 0.45,
          strokeWidth: isActive ? 2.5 : 1.5,
          duration: 0.3,
        });
      }
    });
  }, [activeId]);

  const activeNode = NODES.find((n) => n.id === activeId);

  const sceneInner = (
    <div
      ref={sceneRef}
      className="relative w-full max-w-[500px] aspect-square rounded-3xl border border-[var(--border)] bg-[#050508] p-3 sm:p-4 flex items-center justify-center overflow-hidden shadow-[0_28px_90px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)]"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      role="img"
      aria-label="Interactive Digital Learner Twin signal map. Hover or focus nodes to inspect signals."
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(94,90,215,0.14) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 80% 75%, rgba(255,122,69,0.08) 0%, transparent 50%)",
        }}
        aria-hidden
      />

      <svg ref={svgRef} viewBox="0 0 500 500" className="relative z-10 w-full h-full touch-none">
        <defs>
          <radialGradient id={`${uid}-hub`} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffd166" stopOpacity="0.9" />
            <stop offset="45%" stopColor="var(--brand-accent)" stopOpacity="1" />
            <stop offset="100%" stopColor="#5e2a10" stopOpacity="1" />
          </radialGradient>
          <filter id={`${uid}-glow`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`${uid}-node-glow`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse
          cx="250"
          cy="268"
          rx="165"
          ry="42"
          className="twin-ring fill-none stroke-white/[0.04] stroke-[1]"
          transform="rotate(-12 250 268)"
        />
        <ellipse
          cx="250"
          cy="250"
          rx="195"
          ry="58"
          className="twin-ring fill-none stroke-brand-secondary/20 stroke-[1]"
          transform="rotate(8 250 250)"
        />
        <ellipse
          cx="250"
          cy="252"
          rx="128"
          ry="128"
          className="twin-ring fill-none stroke-[var(--brand-accent)]/15 stroke-[1]"
          strokeDasharray="6 10"
        />

        {[
          [88, 420, 0.35],
          [410, 380, 0.4],
          [460, 140, 0.3],
          [40, 120, 0.25],
          [200, 60, 0.2],
          [320, 460, 0.3],
        ].map(([x, y, o], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i % 2 === 0 ? 2 : 1.5}
            className="twin-particle fill-white"
            opacity={o}
          />
        ))}

        <g opacity="0.35" aria-hidden>
          <line x1="100" y1="400" x2="400" y2="400" stroke="white" strokeWidth="0.5" strokeOpacity="0.08" />
          <line x1="130" y1="400" x2="115" y2="370" stroke="white" strokeWidth="0.5" strokeOpacity="0.06" />
          <line x1="370" y1="400" x2="385" y2="370" stroke="white" strokeWidth="0.5" strokeOpacity="0.06" />
        </g>

        {NODES.map((node, i) => {
          const next = NODES[(i + 1) % NODES.length];
          return (
            <line
              key={`outer-${node.id}`}
              x1={node.cx}
              y1={node.cy}
              x2={next.cx}
              y2={next.cy}
              className="twin-line stroke-white/[0.06] stroke-[1]"
              strokeDasharray="4 6"
            />
          );
        })}

        {NODES.map((node) => (
          <line
            key={`hub-${node.id}`}
            data-link={node.id}
            x1={HUB.cx}
            y1={HUB.cy}
            x2={node.cx}
            y2={node.cy}
            className="twin-line stroke-brand-secondary/45 stroke-[1.5]"
            style={{ stroke: node.tone === "accent" ? "color-mix(in srgb, var(--brand-accent) 50%, transparent)" : undefined }}
          />
        ))}

        <circle cx={HUB.cx} cy={HUB.cy} r="38" className="twin-pulse fill-[var(--brand-accent)]/15" filter={`url(#${uid}-glow)`} />
        <circle cx={HUB.cx} cy={HUB.cy} r="22" className="twin-center fill-[url(#${uid}-hub)] stroke-white/15 stroke-[2]" filter={`url(#${uid}-glow)`} />
        <text x={HUB.cx} y={HUB.cy + 4} textAnchor="middle" className="twin-center fill-white font-mono text-[10px] font-bold pointer-events-none">
          TWIN
        </text>

        {NODES.map((node) => {
          const active = activeId === node.id;
          const labelY = node.cy < HUB.cy ? node.cy - 22 : node.cy + 28;
          return (
            <g
              key={node.id}
              data-node={node.id}
              className="twin-node-group cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`${node.label}: ${node.metric}. ${active ? "Selected" : "Select to highlight"}`}
              aria-pressed={active}
              onMouseEnter={() => setActiveId(node.id)}
              onMouseLeave={() => setActiveId(null)}
              onFocus={() => setActiveId(node.id)}
              onBlur={() => setActiveId(null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveId((prev) => (prev === node.id ? null : node.id));
                }
              }}
            >
              <circle
                cx={node.cx}
                cy={node.cy}
                r={active ? 14 : 10}
                className="twin-node fill-transparent stroke-transparent"
              />
              <circle
                cx={node.cx}
                cy={node.cy}
                r={active ? 10 : 7}
                fill={toneFill(node.tone, active)}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1.5}
                filter={active ? `url(#${uid}-node-glow)` : undefined}
              />
              <text
                x={node.cx}
                y={labelY}
                textAnchor="middle"
                className="twin-label fill-white/90 font-mono text-[10px] font-medium pointer-events-none"
              >
                {node.label}
              </text>
              {active && (
                <text x={node.cx} y={labelY + 14} textAnchor="middle" className="fill-[var(--brand-accent)] font-mono text-[9px] pointer-events-none">
                  {node.metric}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {!reducedMotion && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 rounded-3xl"
          style={{ background: spotlightBg }}
          aria-hidden
        />
      )}

      {activeNode && (
        <div className="absolute bottom-3 left-3 right-3 z-30 rounded-xl border border-white/10 bg-black/75 px-3 py-2 backdrop-blur-sm sm:hidden">
          <p className="text-[10px] font-mono uppercase tracking-wider text-white/50">Signal</p>
          <p className="text-sm font-semibold text-white">{activeNode.label}</p>
          <p className="text-xs text-[var(--brand-accent)] font-mono">{activeNode.metric}</p>
        </div>
      )}
    </div>
  );

  return (
    <div ref={containerRef} className="lg:col-span-7 flex justify-center items-center">
      {reducedMotion ? (
        sceneInner
      ) : (
        <div className="relative w-full max-w-[500px]" style={{ perspective: "1200px" }}>
          <motion.div className="w-full [transform-style:preserve-3d]" style={{ rotateX, rotateY }}>
            {sceneInner}
          </motion.div>
        </div>
      )}
    </div>
  );
}

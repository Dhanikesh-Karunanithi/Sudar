"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

const ATMOSPHERE_IMG =
  "https://framerusercontent.com/images/9zvwRJAavKKacVyhFCwHyXW1U.png?width=1536&height=1024";
const HAND_LEFT =
  "https://framerusercontent.com/images/KNhiA5A2ykNYqNkj04Hk6BVg5A.png?width=1540&height=1320";
const HAND_RIGHT =
  "https://framerusercontent.com/images/X89VFCABCEjjZ4oLGa3PjbOmsA.png?width=1542&height=1002";

function useHeroParallax() {
  const [style, setStyle] = useState({ transform: "translateY(0)", opacity: 1 });

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 1000) {
        setStyle({
          transform: `translateY(${y * 0.4}px)`,
          opacity: Math.max(0, 1 - y / 600),
        });
      }
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return style;
}

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
  const heroStyle = useHeroParallax();
  const currentTime = useCurrentTime();

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 sm:pt-28 pb-16 sm:pb-20 bg-[#050505]"
      aria-label="Hero"
    >
      {/* Background atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-60 mix-blend-screen relative">
          <Image
            src={ATMOSPHERE_IMG}
            alt=""
            fill
            className="object-cover object-center opacity-80"
            priority
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050505] z-10" />
      </div>

      {/* Floating elements */}
      <div className="absolute -left-[10%] top-[-10%] md:left-[-5%] md:top-[-15%] w-[50vw] md:w-[40vw] max-w-[800px] z-10 pointer-events-none mix-blend-hard-light opacity-80 animate-float-left">
        <Image
          src={HAND_LEFT}
          alt=""
          width={770}
          height={660}
          className="w-full h-auto object-contain"
        />
      </div>
      <div className="absolute -right-[10%] bottom-[-10%] md:right-[-5%] md:bottom-[-5%] w-[45vw] md:w-[35vw] max-w-[700px] z-10 pointer-events-none mix-blend-hard-light opacity-80 animate-float-right">
        <Image
          src={HAND_RIGHT}
          alt=""
          width={771}
          height={501}
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Hero content */}
      <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8 relative z-20 text-center flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <div
          className="max-w-4xl w-full mx-auto transition-opacity duration-300"
          style={heroStyle}
        >
          <div className="reveal">
            <h1
              className="text-5xl md:text-7xl font-medium leading-[1.1] tracking-tight mb-6 text-[#ffe0e0] mix-blend-overlay font-serif"
              style={{ textShadow: "0 0 12px rgba(255,255,255,0.71)" }}
            >
              Sudar. <br />
              <span className="italic font-light text-[#ffe0e0]">
                The operating system for learning.
              </span>
            </h1>
          </div>

          <div className="reveal" style={{ transitionDelay: "200ms" }}>
            <p
              className="text-base md:text-lg text-[#ffe0e0]/90 max-w-lg mx-auto mb-16 font-light tracking-wide leading-relaxed mix-blend-overlay"
              style={{ textShadow: "0 0 12px rgba(255,255,255,0.71)" }}
            >
              Build courses in minutes. Deliver them in the format each learner
              needs. Every learner gets a tutor that remembers.
            </p>
          </div>

          <div
            className="reveal flex flex-col items-center gap-6"
            style={{ transitionDelay: "400ms" }}
          >
            <Link
              href="#expertise"
              className="relative group cursor-pointer block"
            >
              <div className="absolute inset-0 bg-[#FF4500]/20 blur-xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
              <span className="relative border border-white/20 bg-white/5 backdrop-blur-sm px-6 py-2 rounded-full flex items-center gap-3 text-xs md:text-sm text-white/80 uppercase tracking-widest hover:bg-white/10 transition-colors duration-300">
                Explore Sudar
              </span>
            </Link>

            <div className="flex items-center gap-4 text-[10px] md:text-xs text-white/40 uppercase tracking-widest mt-8 font-mono">
              <span>{currentTime}</span>
              <span className="w-px h-3 bg-white/20" />
              <span>Teach with Sudar</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

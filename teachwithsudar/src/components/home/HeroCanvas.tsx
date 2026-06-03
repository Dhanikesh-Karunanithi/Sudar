"use client";

import { useEffect, useRef } from "react";

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particles/Orbital rings configuration
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      angle: number;
      speed: number;
      orbitRadius: number;
      color: string;
      opacity: number;
    }> = [];

    // Create orbital particles
    const numParticles = 40;
    for (let i = 0; i < numParticles; i++) {
      const isCoral = Math.random() > 0.5;
      particles.push({
        x: 0,
        y: 0,
        radius: Math.random() * 2 + 1,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() * 0.002 + 0.0005) * (Math.random() > 0.5 ? 1 : -1),
        orbitRadius: Math.random() * 300 + 100,
        color: isCoral ? "255, 69, 0" : "94, 90, 215", // Coral or Indigo
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw ambient background glows
      const gradient = ctx.createRadialGradient(
        width * 0.3,
        height * 0.3,
        50,
        width * 0.3,
        height * 0.3,
        width * 0.6
      );
      gradient.addColorStop(0, "rgba(94, 90, 215, 0.12)"); // Indigo
      gradient.addColorStop(1, "rgba(5, 5, 5, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const gradient2 = ctx.createRadialGradient(
        width * 0.7,
        height * 0.6,
        50,
        width * 0.7,
        height * 0.6,
        width * 0.5
      );
      gradient2.addColorStop(0, "rgba(255, 69, 0, 0.08)"); // Coral
      gradient2.addColorStop(1, "rgba(5, 5, 5, 0)");
      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, width, height);

      // Draw orbital rings
      ctx.strokeStyle = "rgba(255, 255, 255, 0.015)";
      ctx.lineWidth = 1;
      const center = { x: width / 2, y: height / 2 };

      const rings = [150, 250, 350, 450];
      rings.forEach((r) => {
        ctx.beginPath();
        ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Update and draw particles
      particles.forEach((p) => {
        p.angle += p.speed;
        p.x = center.x + Math.cos(p.angle) * p.orbitRadius;
        p.y = center.y + Math.sin(p.angle) * p.orbitRadius;

        // Draw particle glow
        const particleGlow = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          p.radius * 4
        );
        particleGlow.addColorStop(0, `rgba(${p.color}, ${p.opacity})`);
        particleGlow.addColorStop(1, `rgba(${p.color}, 0)`);
        ctx.fillStyle = particleGlow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw core particle
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity + 0.2})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mediaQuery.matches) {
      draw();
    } else {
      // Static render for reduced motion
      ctx.clearRect(0, 0, width, height);
      // Just draw background glows
      const gradient = ctx.createRadialGradient(width * 0.3, height * 0.3, 50, width * 0.3, height * 0.3, width * 0.6);
      gradient.addColorStop(0, "rgba(94, 90, 215, 0.1)");
      gradient.addColorStop(1, "rgba(5, 5, 5, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const gradient2 = ctx.createRadialGradient(width * 0.7, height * 0.6, 50, width * 0.7, height * 0.6, width * 0.5);
      gradient2.addColorStop(0, "rgba(255, 69, 0, 0.06)");
      gradient2.addColorStop(1, "rgba(5, 5, 5, 0)");
      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, width, height);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}

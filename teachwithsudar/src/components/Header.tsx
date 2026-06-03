"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { SudarLogoMark } from "@/components/brand/SudarLogoMark";
import {
  HERO_NAV_COMPACT_THRESHOLD,
  useHeroLogoScroll,
} from "@/hooks/useHeroLogoScroll";
import { GITHUB_URL } from "@/lib/site-nav";

const NAV_LINKS = [
  { href: "https://learn.thesudar.com/login", label: "Sudar Learn", external: true },
  { href: "https://studio.thesudar.com/login", label: "Sudar Studio", external: true },
  { href: "https://teachwithsudar.com/features", label: "Docs & Research", external: true },
] as const;

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { active: heroLogoActive, settled: heroLogoSettled } = useHeroLogoScroll(isHome);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(
        heroLogoActive ? y > HERO_NAV_COMPACT_THRESHOLD : y > 50
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [heroLogoActive]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "py-4 bg-[#050505]/80 backdrop-blur-md border-b border-white/5"
            : "py-6 sm:py-8 bg-transparent"
        }`}
      >
        <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <Link
            id="nav-logo-anchor"
            href="/"
            className={`flex items-center gap-2.5 sm:gap-3 text-xl sm:text-2xl font-bold tracking-tighter font-serif text-white shrink-0 ${
              heroLogoActive && !heroLogoSettled ? "invisible" : ""
            }`}
            onClick={() => setMobileOpen(false)}
            aria-hidden={heroLogoActive && !heroLogoSettled}
            tabIndex={heroLogoActive && !heroLogoSettled ? -1 : undefined}
          >
            <span className="inline-flex shrink-0" aria-hidden="true">
              <SudarLogoMark size={36} variant="on-dark" />
            </span>
            Sudar.
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map(({ href, label, external }) => (
              <a
                key={href}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="text-sm text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-1"
              >
                {label}
                {external && (
                  <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                )}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:inline"
            >
              GitHub
            </a>

            {/* Premium Open Space Dropdown */}
            <div ref={dropdownRef} className="relative hidden sm:inline-block">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-sm font-semibold bg-white text-black hover:bg-gray-100 transition-all duration-300"
              >
                Open Sudar
                <svg className={`w-4 h-4 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-white/5 bg-[#0d0d0d] p-3 shadow-2xl backdrop-blur-md animate-fade-up-in">
                  <div className="flex flex-col gap-1">
                    <a
                      href="https://learn.thesudar.com/login"
                      className="flex flex-col gap-1 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                    >
                      <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">Sudar Learn</span>
                      <span className="text-xs text-foreground-muted font-light">Enter your personal learning space</span>
                    </a>
                    <a
                      href="https://studio.thesudar.com/login"
                      className="flex flex-col gap-1 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group border-t border-white/5"
                    >
                      <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">Sudar Studio</span>
                      <span className="text-xs text-foreground-muted font-light">Create and manage courses</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden bg-[#050505]/95 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex flex-col items-center justify-center min-h-full gap-8 pt-24 pb-12 px-6">
          {NAV_LINKS.map(({ href, label, external }) => (
            <a
              key={href}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="text-lg text-gray-300 hover:text-white transition-colors flex items-center gap-1"
              onClick={() => setMobileOpen(false)}
            >
              {label}
              {external && (
                <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              )}
            </a>
          ))}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg text-gray-400 hover:text-white transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            GitHub
          </a>
          <div className="flex flex-col gap-4 w-full max-w-[280px] mt-4">
            <a
              href="https://learn.thesudar.com/login"
              className="inline-flex items-center justify-center w-full px-6 py-3.5 rounded-full text-base font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all text-center"
              onClick={() => setMobileOpen(false)}
            >
              Open Sudar Learn
            </a>
            <a
              href="https://studio.thesudar.com/login"
              className="inline-flex items-center justify-center w-full px-6 py-3.5 rounded-full text-base font-semibold bg-white text-black hover:bg-gray-100 transition-all text-center"
              onClick={() => setMobileOpen(false)}
            >
              Open Sudar Studio
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

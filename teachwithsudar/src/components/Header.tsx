"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GITHUB_URL } from "@/lib/site-nav";

const NAV_LINKS = [
  { href: "/#expertise", label: "Expertise" },
  { href: "/#works", label: "How it works" },
  { href: "/story", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/self-host", label: "Get Started" },
  { href: "/collaborate", label: "Collaborate" },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

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
            href="/"
            className="text-xl sm:text-2xl font-bold tracking-tighter font-serif text-white shrink-0"
            onClick={() => setMobileOpen(false)}
          >
            Sudar.
          </Link>

          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-gray-400 hover:text-white transition-colors duration-300"
              >
                {label}
              </Link>
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
            <Link
              href="/self-host"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-sm font-medium bg-white text-black hover:scale-105 hover:bg-gray-100 transition-all duration-300"
            >
              Start with Sudar
            </Link>
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
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-lg text-gray-300 hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
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
          <Link
            href="/self-host"
            className="mt-4 inline-flex items-center justify-center px-8 py-4 rounded-full text-base font-medium bg-white text-black hover:bg-gray-100 transition-all"
            onClick={() => setMobileOpen(false)}
          >
            Start with Sudar
          </Link>
        </div>
      </div>
    </>
  );
}

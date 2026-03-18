"use client";

import Link from "next/link";
import { HeroSection } from "@/components/home/HeroSection";
import { STUDIO_APP_URL, LEARN_APP_URL } from "@/lib/site-nav";
import { useEffect } from "react";

function useParallaxCards() {
  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      document.querySelectorAll(".parallax-card-up").forEach((el) => {
        (el as HTMLElement).style.setProperty(
          "--scroll-offset-up",
          `${scrolled * -0.05}px`
        );
      });
      document.querySelectorAll(".parallax-card-down").forEach((el) => {
        (el as HTMLElement).style.setProperty(
          "--scroll-offset-down",
          `${scrolled * 0.05}px`
        );
      });
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}

export default function HomePage() {
  useParallaxCards();

  return (
    <div className="w-full">
      <HeroSection />

      {/* Mission / Expertise */}
      <section
        id="expertise"
        className="py-20 sm:py-24 md:py-32 scroll-mt-20"
      >
        <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center reveal">
            <h2 className="text-3xl md:text-5xl lg:text-6xl leading-tight text-white/90 mb-12 font-serif">
              One platform for authoring, delivery, and intelligence.
            </h2>
            <p className="text-xl md:text-2xl text-gray-500 leading-relaxed font-light">
              Studio, Intelligence, and Learn share one learner model. You build
              courses. Learners get a tutor that remembers and adapts.
            </p>
          </div>

          <div className="mt-16 sm:mt-20 md:mt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 items-center justify-items-center opacity-60 hover:opacity-100 transition-opacity duration-500">
            <div className="reveal font-bold text-xl tracking-widest text-white/90">
              Studio
            </div>
            <div
              className="reveal font-bold text-xl tracking-widest text-white/90"
              style={{ transitionDelay: "100ms" }}
            >
              Intelligence
            </div>
            <div
              className="reveal font-bold text-xl tracking-widest text-white/90"
              style={{ transitionDelay: "200ms" }}
            >
              Learn
            </div>
          </div>
        </div>
      </section>

      {/* Cards — How it works */}
      <section
        id="works"
        className="py-20 sm:py-24 md:py-32 relative overflow-hidden"
      >
        <div className="mx-auto w-full max-w-content-wide px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="reveal mb-16 sm:mb-20 md:mb-24">
            <h2 className="text-5xl md:text-7xl text-center font-serif text-white">
              Define your <br />
              <span className="italic">learning presence</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl md:max-w-5xl mx-auto">
            <div className="parallax-card-down">
              <Link
                href="/features"
                className="reveal block bg-[#FF4500] rounded-3xl p-8 md:p-12 aspect-[4/5] flex flex-col justify-between shadow-2xl hover:shadow-[0_20px_50px_rgba(255,69,0,0.3)] transition-all duration-500 group cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                    <svg
                      className="w-6 h-6 text-black"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z"
                      />
                    </svg>
                  </div>
                  <span className="text-black font-medium text-sm border border-black/20 px-3 py-1 rounded-full">
                    01
                  </span>
                </div>
                <div>
                  <h3 className="text-4xl md:text-5xl text-black mb-4 leading-none tracking-tight font-serif">
                    Create <br />
                    in minutes
                  </h3>
                  <p className="text-black/70 text-lg leading-snug">
                    Upload a PDF or paste a URL. AI generates the course. You
                    review, edit, and publish to Learn. No instructional designer
                    required.
                  </p>
                  <span
                    className="mt-4 inline-block text-sm font-medium text-black/80 hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(STUDIO_APP_URL, "_blank", "noopener,noreferrer");
                    }}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(STUDIO_APP_URL, "_blank", "noopener,noreferrer");
                      }
                    }}
                  >
                    Try Sudar Studio →
                  </span>
                </div>
                <div className="w-full h-px bg-black/10 mt-8" />
              </Link>
            </div>

            <div className="parallax-card-up md:mt-24">
              <Link
                href="/alp"
                className="reveal block bg-[#111] border border-white/10 rounded-3xl p-8 md:p-12 aspect-[4/5] flex flex-col justify-between shadow-2xl group cursor-pointer hover:border-[#FF4500]/50 transition-all duration-500"
                style={{ transitionDelay: "150ms" }}
              >
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <svg
                      className="w-6 h-6 text-white -rotate-45"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </div>
                  <span className="text-white/50 font-medium text-sm border border-white/10 px-3 py-1 rounded-full">
                    02
                  </span>
                </div>
                <div>
                  <h3 className="text-4xl md:text-5xl text-white mb-4 leading-none tracking-tight font-serif">
                    Adapt <br />
                    to everyone
                  </h3>
                  <p className="text-gray-400 text-lg leading-snug">
                    A persistent learner profile, an AI tutor with memory, and
                    next-best-action recommendations. Every session builds on the
                    last.
                  </p>
                  <span
                    className="mt-4 inline-block text-sm font-medium text-white/80 hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(LEARN_APP_URL, "_blank", "noopener,noreferrer");
                    }}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(LEARN_APP_URL, "_blank", "noopener,noreferrer");
                      }
                    }}
                  >
                    Try Sudar Learn →
                  </span>
                </div>
                <div className="w-full h-px bg-white/10 mt-8" />
              </Link>
            </div>
          </div>
        </div>

        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #333 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </section>

      {/* Problem we solve */}
      <section className="py-20 sm:py-24 md:py-32">
        <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto reveal">
            <h2 className="text-3xl md:text-5xl text-white/90 mb-8 font-serif">
              The problem we solve
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed mb-6">
              Most LMSs serve the same content to everyone and do not adapt.
              Sudar keeps a persistent learner profile, offers multiple formats
              (text, audio, video, flashcards), and an AI tutor that remembers
              across sessions.
            </p>
            <Link
              href="/research"
              className="inline-flex items-center text-[#FF4500] font-medium transition-colors hover:underline"
            >
              Research foundation →
            </Link>
          </div>
        </div>
      </section>

      {/* Get started CTA */}
      <section className="py-20 sm:py-24 md:py-32 border-t border-white/5">
        <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center reveal">
            <h2 className="text-3xl md:text-5xl text-white font-serif mb-6">
              Get started
            </h2>
            <p className="text-xl text-gray-500 mb-10">
              Self-host at $0 on Vercel and Railway. Or plug adaptive learning
              into Moodle with ALP.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link
                href="/self-host"
                className="text-[#FF4500] font-medium transition-colors hover:underline"
              >
                Self-host at $0
              </Link>
              <Link
                href="/collaborate"
                className="text-[#FF4500] font-medium transition-colors hover:underline"
              >
                Collaborate
              </Link>
              <Link
                href="/blog"
                className="text-[#FF4500] font-medium transition-colors hover:underline"
              >
                Blog
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

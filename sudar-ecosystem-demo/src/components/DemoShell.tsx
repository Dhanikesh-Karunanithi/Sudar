"use client";

import Link from "next/link";
import { SudarLogoMark } from "@/components/brand/SudarLogoMark";

const GITHUB_URL = "https://github.com/Dhanikesh-Karunanithi/Sudar";
const TEACH_URL = "https://teachwithsudar.com";

export function DemoShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-3 group">
          <SudarLogoMark size={32} variant="on-dark" />
          <div>
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              Sudar Ecosystem Demo
            </p>
            <p className="text-[10px] font-mono text-foreground-muted">Wireframe tour · autoplay</p>
          </div>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <a
            href={TEACH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground-muted hover:text-foreground hidden sm:inline"
          >
            teachwithsudar.com
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            GitHub
          </a>
        </nav>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}

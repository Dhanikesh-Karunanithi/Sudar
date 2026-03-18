import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { NoiseOverlay } from "./NoiseOverlay";
import { RevealObserver } from "./RevealObserver";

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#050505]">
      <NoiseOverlay />
      <RevealObserver />
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}

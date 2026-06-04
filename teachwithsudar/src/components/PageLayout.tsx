import { ReactNode } from "react";
import { Header as GatewayHeader } from "./Header";
import { MarketingHeader } from "./MarketingHeader";
import { Footer } from "./Footer";
import { NoiseOverlay } from "./NoiseOverlay";
import { RevealObserver } from "./RevealObserver";
import { IS_GATEWAY_SITE } from "@/lib/site-variant";

export function PageLayout({ children }: { children: ReactNode }) {
  const Header = IS_GATEWAY_SITE ? GatewayHeader : MarketingHeader;

  return (
    <div
      className={`flex min-h-screen flex-col ${IS_GATEWAY_SITE ? "bg-[var(--surface)]" : "bg-[#050505]"}`}
    >
      <NoiseOverlay />
      <RevealObserver />
      <Header />
      <main className="flex-1 w-full pt-[var(--site-header-offset)]">{children}</main>
      <Footer />
    </div>
  );
}

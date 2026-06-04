import type { Metadata } from "next";
import { Inter, Playfair_Display, Manrope } from "next/font/google";
import "./globals.css";
import "../styles/gateway-theme.css";
import { PageLayout } from "@/components/PageLayout";
import { GsapLenisProvider } from "@/components/GsapLenisProvider";
import { IS_GATEWAY_SITE, SITE_URL } from "@/lib/site-variant";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

const gatewayTitle = "Sudar — Learns with you, for you.";
const marketingTitle = "Teach with Sudar | The Operating System for Learning";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: IS_GATEWAY_SITE ? gatewayTitle : marketingTitle,
    template: IS_GATEWAY_SITE ? "%s | Sudar" : "%s | Teach with Sudar",
  },
  description:
    "Sudar combines Studio (authoring), Learn (delivery), and Intelligence (adaptive tutoring). Self-host on free tiers or extend your LMS with ALP.",
  openGraph: {
    title: IS_GATEWAY_SITE ? gatewayTitle : marketingTitle,
    description: "Open-source courses, multimodal delivery, and a tutor that keeps context across sessions.",
    url: SITE_URL,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shell = <PageLayout>{children}</PageLayout>;

  return (
    <html
      lang="en"
      data-site-variant={IS_GATEWAY_SITE ? "gateway" : "marketing"}
      className={`scroll-smooth ${inter.variable} ${playfair.variable}${IS_GATEWAY_SITE ? ` ${manrope.variable}` : ""}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[var(--bg)] font-sans text-foreground antialiased" suppressHydrationWarning>
        {IS_GATEWAY_SITE ? <GsapLenisProvider>{shell}</GsapLenisProvider> : shell}
      </body>
    </html>
  );
}

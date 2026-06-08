import type { Metadata } from "next";
import { Inter, Playfair_Display, Manrope } from "next/font/google";
import "./globals.css";
import "../styles/gateway-theme.css";
import { PageLayout } from "@/components/PageLayout";
import { GsapLenisProvider } from "@/components/GsapLenisProvider";
import { CONTACT_EMAIL, GITHUB_URL, LEARN_APP_URL, STUDIO_APP_URL } from "@/lib/site-nav";
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
    "Sudar combines Studio (authoring), Learn (delivery), and Intelligence (adaptive tutoring). Forever free to self-host — open AI-powered education by Dhanikesh Karunanithi.",
  keywords: [
    "Sudar",
    "AI learning",
    "free LMS",
    "open source education",
    "AI tutor",
    "L&D platform",
    "corporate training",
    "multimodal learning",
    "ByteVerse",
    "MCP",
    "Model Context Protocol",
    "self-host LMS",
  ],
  authors: [{ name: "Dhanikesh Karunanithi", url: GITHUB_URL }],
  creator: "Dhanikesh Karunanithi",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: IS_GATEWAY_SITE ? gatewayTitle : marketingTitle,
    description:
      "Open-source, forever-free AI learning OS. Multimodal delivery and a tutor that keeps context across sessions.",
    url: SITE_URL,
    siteName: IS_GATEWAY_SITE ? "Sudar" : "Teach with Sudar",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@dhanikesh",
    title: IS_GATEWAY_SITE ? gatewayTitle : marketingTitle,
    description:
      "Sudar — forever free, open AI-powered education. Studio, Learn, Intelligence, and MCP for AI agents.",
  },
  alternates: {
    types: {
      "text/plain": `${SITE_URL}/llms.txt`,
    },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Sudar",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description:
        "AI-native Learning Operating System — Studio for authoring, Learn for delivery, Intelligence for adaptive tutoring. Forever free to self-host.",
      url: SITE_URL,
      downloadUrl: GITHUB_URL,
      codeRepository: GITHUB_URL,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Forever free — self-host on $0 infrastructure tiers",
      },
      author: {
        "@type": "Person",
        name: "Dhanikesh Karunanithi",
        alternateName: "Dhani",
        url: GITHUB_URL,
        email: CONTACT_EMAIL,
      },
      featureList: [
        "AI course creation (Sudar Studio)",
        "Personalized multimodal learning (Sudar Learn)",
        "AI tutor with longitudinal memory",
        "Model Context Protocol (MCP) integration",
        "ALP plugin layer for external LMSs",
      ],
    },
    {
      "@type": "Organization",
      name: "Sudar",
      url: SITE_URL,
      sameAs: [GITHUB_URL, STUDIO_APP_URL, LEARN_APP_URL, "https://mcp.thesudar.com"],
      founder: {
        "@type": "Person",
        name: "Dhanikesh Karunanithi",
        alternateName: "Dhani",
      },
      description:
        "Open, forever-free AI-powered education platform. Part of the ByteVerse inter-tech ecosystem.",
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {IS_GATEWAY_SITE ? <GsapLenisProvider>{shell}</GsapLenisProvider> : shell}
      </body>
    </html>
  );
}

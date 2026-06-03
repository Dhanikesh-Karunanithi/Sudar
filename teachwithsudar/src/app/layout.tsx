import type { Metadata } from "next";
import { Inter, Playfair_Display, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { PageLayout } from "@/components/PageLayout";
import { GsapLenisProvider } from "@/components/GsapLenisProvider";

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

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://thesudar.com"),
  title: { default: "Teach with Sudar — The Operating System for Learning", template: "%s | Teach with Sudar" },
  description:
    "Sudar combines Studio (authoring), Learn (delivery), and Intelligence (adaptive tutoring). Self-host on free tiers or extend your LMS with ALP.",
  openGraph: {
    title: "Teach with Sudar — The Operating System for Learning",
    description: "Open-source courses, multimodal delivery, and a tutor that keeps context across sessions.",
    url: "https://thesudar.com",
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${inter.variable} ${playfair.variable} ${bricolage.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[var(--bg)] font-sans text-foreground antialiased" suppressHydrationWarning>
        <GsapLenisProvider>
          <PageLayout>{children}</PageLayout>
        </GsapLenisProvider>
      </body>
    </html>
  );
}

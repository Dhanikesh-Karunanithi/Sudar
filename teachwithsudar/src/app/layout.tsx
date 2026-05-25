import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { PageLayout } from "@/components/PageLayout";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://teachwithsudar.com"),
  title: { default: "Teach with Sudar | The Operating System for Learning", template: "%s | Teach with Sudar" },
  description:
    "Sudar combines Studio (authoring), Learn (delivery), and Intelligence (adaptive tutoring). Self-host on free tiers or extend your LMS with ALP.",
  openGraph: {
    title: "Teach with Sudar | The Operating System for Learning",
    description: "Open-source courses, multimodal delivery, and a tutor that keeps context across sessions.",
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
      className={`scroll-smooth ${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[var(--bg)] font-sans text-foreground antialiased" suppressHydrationWarning>
        <PageLayout>{children}</PageLayout>
      </body>
    </html>
  );
}

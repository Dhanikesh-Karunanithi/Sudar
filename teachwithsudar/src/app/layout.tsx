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
  title: { default: "Teach with Sudar — The Operating System for Learning", template: "%s | Teach with Sudar" },
  description:
    "Sudar is the AI-native learning platform. Build courses in Studio, deliver in Learn, and power both with adaptive intelligence. Self-host at $0 or plug into your LMS.",
  openGraph: {
    title: "Teach with Sudar — The Operating System for Learning",
    description: "Build courses in minutes. Deliver adaptively. Every learner gets a tutor that remembers.",
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

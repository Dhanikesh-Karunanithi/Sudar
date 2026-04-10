import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import "./course-personas.css";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: 'Sudar Learn', template: '%s | Sudar Learn' },
  description: "Your personalized AI-powered learning experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${manrope.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

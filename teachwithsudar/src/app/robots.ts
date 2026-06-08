import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-variant";

export const dynamic = "force-static";

const AI_CRAWLERS = [
  "Googlebot",
  "Google-Extended",
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web",
  "PerplexityBot",
  "Bingbot",
  "MicrosoftPreview",
  "facebookexternalhit",
  "Applebot",
  "cohere-ai",
  "CCBot",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

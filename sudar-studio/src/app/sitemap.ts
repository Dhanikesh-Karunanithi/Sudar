import type { MetadataRoute } from "next";

const SITE_URL = "https://studio.thesudar.com";

/** Public routes only — dashboard and API routes require authentication. */
const PUBLIC_PATHS = ["/login", "/signup"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));
}

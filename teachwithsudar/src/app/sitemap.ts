import type { MetadataRoute } from "next";
import { blogPosts } from "@/data/blogPosts";
import { tutorials } from "@/data/tutorials";
import { slugParamsForMarketingArticles } from "@/lib/helpCenterPublic";
import { allNavLinks } from "@/lib/site-nav";
import { SITE_URL } from "@/lib/site-variant";

export const dynamic = "force-static";

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths.map((p) => (p.startsWith("/") ? p : `/${p}`)))];
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPaths = uniquePaths([
    "/",
    ...allNavLinks.map((link) => link.href),
    "/help/learn",
    "/help/studio",
  ]);

  const blogPaths = Object.keys(blogPosts).map((slug) => `/blog/${slug}`);
  const guidePaths = tutorials.map((tutorial) => `/guides/${tutorial.slug}`);
  const helpPaths = slugParamsForMarketingArticles().map(
    (params) => `/help/article/${params.slug.join("/")}`
  );

  const allPaths = uniquePaths([...staticPaths, ...blogPaths, ...guidePaths, ...helpPaths]);

  return allPaths.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/blog") || path.startsWith("/guides") ? 0.8 : 0.7,
  }));
}

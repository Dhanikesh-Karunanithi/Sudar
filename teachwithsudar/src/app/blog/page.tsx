import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";
import { blogPosts, getAllSlugs } from "@/data/blogPosts";

export const metadata = {
  title: "Blog",
};

export default function BlogPage() {
  const slugs = getAllSlugs();

  return (
    <ProseSection title="Blog">
      <p className="text-lg text-foreground">
        How-tos and guides for building courses, running L&D solo, and improving completion with adaptive learning.
      </p>
      <ul className="mt-10 space-y-6">
        {slugs.map((slug) => {
          const post = blogPosts[slug];
          if (!post) return null;
          return (
          <li key={slug} className="rounded-xl border border-card-border bg-card-bg p-6 shadow-card">
            <h2 className="text-xl font-semibold text-foreground">
              <Link href={`/blog/${slug}`} className="hover:text-accent">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-slate-400">{post.date}</p>
            <p className="mt-2 text-foreground">{post.excerpt}</p>
            <Link href={`/blog/${slug}`} className="mt-3 inline-block text-accent hover:underline">
              Read more →
            </Link>
          </li>
          );
        })}
      </ul>
      <p className="mt-10 text-slate-500">
        More posts will be added over time. Follow the repo on GitHub for new guides and updates.
      </p>
    </ProseSection>
  );
}

import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { blogPosts, getAllSlugs } from "@/data/blogPosts";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Evidence-based guides on AI course authoring, solo L&D strategy, learner completion, adaptive learning research, and multimodal delivery, from the Sudar team.",
  keywords: [
    "adaptive learning",
    "L&D blog",
    "course completion rates",
    "AI training authoring",
    "intelligent tutoring systems",
    "multimodal learning",
  ],
  openGraph: {
    title: "Sudar Blog: AI-Native Learning Guides",
    description:
      "Research-informed articles on building courses fast, running L&D solo, and fixing completion, with citations from arXiv and peer-reviewed journals.",
  },
};

export default function BlogPage() {
  const slugs = getAllSlugs();

  return (
    <ProseSection title="Blog">
      <p className="text-lg leading-relaxed text-foreground">
        Evidence-based guides for L&D teams, solo practitioners, and anyone building training that learners actually
        finish. Each article cites published research, arXiv preprints, meta-analyses, and peer-reviewed studies,
        with practical takeaways you can apply this week.
      </p>

      <div className="not-prose mt-10">
        <ul className="space-y-8">
          {slugs.map((slug) => {
            const post = blogPosts[slug];
            if (!post) return null;
            return (
              <li
                key={slug}
                className="overflow-hidden rounded-xl border border-card-border bg-card-bg shadow-card transition hover:border-accent/40"
              >
                <article>
                  {post.heroImage && (
                    <Link href={`/blog/${slug}`} className="block overflow-hidden">
                      <div className="relative isolate aspect-[21/9] w-full overflow-hidden bg-card-bg">
                        <Image
                          src={post.heroImage.src}
                          alt={post.heroImage.alt}
                          fill
                          className="object-cover transition duration-300 hover:scale-[1.02]"
                          sizes="(max-width: 896px) 100vw, 896px"
                        />
                      </div>
                    </Link>
                  )}
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                      <time dateTime={post.date}>{post.date}</time>
                      <span aria-hidden="true">·</span>
                      <span>{post.readingTime}</span>
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-foreground">
                      <Link href={`/blog/${slug}`} className="hover:text-accent">
                        {post.title}
                      </Link>
                    </h2>
                    <p className="mt-2 text-base leading-7 text-foreground">{post.excerpt}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-card-border px-2.5 py-0.5 text-xs text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link href={`/blog/${slug}`} className="mt-4 inline-block text-accent hover:underline">
                      Read article →
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-10 leading-relaxed text-slate-500">
        Explore the{" "}
        <Link href="/research" className="text-accent hover:underline">
          research foundation
        </Link>{" "}
        behind Sudar, or browse{" "}
        <Link href="/papers" className="text-accent hover:underline">
          research papers
        </Link>{" "}
        for deeper academic context.
      </p>
    </ProseSection>
  );
}

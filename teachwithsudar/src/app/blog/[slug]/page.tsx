import { ProseSection } from "@/components/ProseSection";
import { BlogArticle } from "@/components/BlogArticle";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPost, getAllSlugs } from "@/data/blogPosts";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Blog" };

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
      ...(post.heroImage ? { images: [{ url: post.heroImage.src, alt: post.heroImage.alt }] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    keywords: post.tags.join(", "),
    author: {
      "@type": "Organization",
      name: "Sudar",
      url: "https://github.com/Dhanikesh-Karunanithi/Sudar",
    },
    publisher: {
      "@type": "Organization",
      name: "Teach with Sudar",
    },
    ...(post.heroImage ? { image: post.heroImage.src } : {}),
  };

  return (
    <ProseSection title={post.title}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="not-prose">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400">
          <time dateTime={post.date}>{post.date}</time>
          <span aria-hidden="true">·</span>
          <span>{post.readingTime}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-card-border bg-card-bg px-3 py-1 text-xs font-medium text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>

        {post.heroImage && (
          <figure className="mt-8">
            <div className="relative isolate aspect-[16/9] w-full overflow-hidden rounded-xl bg-card-bg shadow-card">
              <Image
                src={post.heroImage.src}
                alt={post.heroImage.alt}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 896px) 100vw, 896px"
              />
            </div>
          </figure>
        )}

        <p className="mt-8 text-lg leading-8 text-foreground">{post.excerpt}</p>

        <BlogArticle sections={post.sections} />

        <Link href="/blog" className="mt-12 inline-block text-accent hover:underline">
          ← Back to Blog
        </Link>
      </div>
    </ProseSection>
  );
}

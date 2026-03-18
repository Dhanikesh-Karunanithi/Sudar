import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPost, getAllSlugs } from "@/data/blogPosts";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <ProseSection title={post.title}>
      <p className="text-slate-400">{post.date}</p>

      {post.sections.map((section, i) => {
        if (section.type === "paragraph") {
          return (
            <div key={i} className="mt-8">
              {section.heading && (
                <h2 className="text-xl font-semibold text-foreground mt-10 mb-2">{section.heading}</h2>
              )}
              <p className="text-foreground leading-relaxed">{section.body}</p>
              {section.cta && (
                <a
                  href={section.cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-accent hover:underline font-medium"
                >
                  {section.cta.label} →
                </a>
              )}
            </div>
          );
        }
        if (section.type === "steps") {
          return (
            <div key={i} className="mt-8">
              <ol className="list-decimal list-inside space-y-6 pl-0 mt-6">
                {section.steps.map((step, j) => (
                  <li key={j} className="text-foreground">
                    <span className="font-semibold">{step.title}.</span> {step.body}
                  </li>
                ))}
              </ol>
              {section.cta && (
                <a
                  href={section.cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  {section.cta.label} →
                </a>
              )}
            </div>
          );
        }
        return null;
      })}

      {post.imageUrls && post.imageUrls.length > 0 && (
        <div className="mt-10 space-y-6">
          {post.imageUrls.map((src, i) => (
            <div key={i} className="relative w-full aspect-video rounded-xl overflow-hidden bg-card-bg">
              <Image src={src} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <Link href="/blog" className="mt-10 inline-block text-accent hover:underline">
        ← Back to Blog
      </Link>
    </ProseSection>
  );
}

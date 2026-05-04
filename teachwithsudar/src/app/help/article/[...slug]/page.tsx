import Link from "next/link";
import { notFound } from "next/navigation";
import { HelpMarkdown } from "@/components/HelpMarkdown";
import { getPublicMarketingArticle, slugParamsForMarketingArticles } from "@/lib/helpCenterPublic";

export async function generateStaticParams() {
  return slugParamsForMarketingArticles();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const article = getPublicMarketingArticle(slug);
  if (!article) return { title: "Sudar Help" };
  return {
    title: `${article.title} — Sudar`,
    description: article.description,
  };
}

export default async function PublicHelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const article = getPublicMarketingArticle(slug);
  if (!article) notFound();

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="text-sm text-foreground-muted mb-6 flex flex-wrap gap-2 items-center">
        <Link href="/help/learn" className="hover:text-primary">
          Learn Help
        </Link>
        <span aria-hidden>·</span>
        <Link href="/help/studio" className="hover:text-primary">
          Studio Help
        </Link>
      </div>
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{article.title}</h1>
      {article.description ? <p className="text-lg text-foreground-muted mb-8">{article.description}</p> : null}
      <HelpMarkdown markdown={article.bodyMarkdown} />
    </section>
  );
}

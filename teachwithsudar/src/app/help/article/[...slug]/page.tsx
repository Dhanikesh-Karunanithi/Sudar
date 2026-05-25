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
    title: `${article.title} | Sudar Help`,
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

  const backHref = article.audience === "admin" ? "/help/studio" : "/help/learn";
  const backLabel = article.audience === "admin" ? "Studio Help" : "Learn Help";

  return (
    <article className="help-hub-shell mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-foreground-muted" aria-label="Breadcrumb">
        <Link href="/help/learn" className="help-hub-link hover:text-primary transition-colors">
          Help Center
        </Link>
        <span aria-hidden className="text-white/30">
          /
        </span>
        <Link href={backHref} className="help-hub-link hover:text-primary transition-colors">
          {backLabel}
        </Link>
        <span aria-hidden className="text-white/30">
          /
        </span>
        <span className="text-foreground">{article.title}</span>
      </nav>

      <h1 className="mt-6 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">{article.title}</h1>
      {article.description ? (
        <p className="mt-3 text-lg text-foreground-muted leading-relaxed">{article.description}</p>
      ) : null}

      <div className="mt-10 rounded-xl border border-card-border bg-card-bg p-6 sm:p-8 shadow-card">
        <HelpMarkdown markdown={article.bodyMarkdown} />
      </div>

      <div className="mt-8">
        <Link
          href={backHref}
          className="help-hub-link inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          ← Back to {backLabel}
        </Link>
      </div>
    </article>
  );
}

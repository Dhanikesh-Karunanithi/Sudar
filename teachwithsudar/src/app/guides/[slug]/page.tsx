import Link from "next/link";
import { notFound } from "next/navigation";
import { ProseSection } from "@/components/ProseSection";
import { AnimatedWorkflow } from "@/components/workflows/AnimatedWorkflow";
import { capabilitySurfaces } from "@/data/platformCapabilities";
import { getAllTutorialSlugs, getTutorial } from "@/data/tutorials";
import { GITHUB_URL } from "@/lib/site-nav";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllTutorialSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const tutorial = getTutorial(slug);
  if (!tutorial) return { title: "Guide" };
  return {
    title: tutorial.title,
    description: tutorial.excerpt,
  };
}

export default async function GuideDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const tutorial = getTutorial(slug);
  if (!tutorial) notFound();

  return (
    <ProseSection title={tutorial.title} wide>
      <p className="text-lg text-foreground-muted max-w-3xl">{tutorial.excerpt}</p>
      <p className="mt-3 text-sm text-foreground-muted">
        <span className="font-mono text-primary/80">{tutorial.duration}</span>
        {" · "}
        {tutorial.surfaces.map((s) => capabilitySurfaces[s].label).join(" · ")}
      </p>

      <div className="mt-10">
        <AnimatedWorkflow steps={tutorial.steps} />
      </div>

      {tutorial.relatedHelp && tutorial.relatedHelp.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-foreground">Related help articles</h2>
          <ul className="mt-4 space-y-2 list-none pl-0">
            {tutorial.relatedHelp.map((helpSlug) => (
              <li key={helpSlug}>
                <Link href={`/help/article/${helpSlug}`} className="text-primary hover:underline font-medium">
                  {helpSlug.replace(/\//g, " · ")} →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-12 flex flex-wrap gap-4 border-t border-card-border pt-8">
        <Link href="/guides" className="text-primary hover:underline font-medium">
          All guides →
        </Link>
        <Link href="/features" className="text-primary hover:underline font-medium">
          Features →
        </Link>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
          Source on GitHub →
        </a>
      </div>
    </ProseSection>
  );
}

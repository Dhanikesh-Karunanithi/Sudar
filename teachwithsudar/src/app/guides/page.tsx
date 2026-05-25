import Link from "next/link";
import { ProseSection } from "@/components/ProseSection";
import { TutorialCard } from "@/components/platform/TutorialCard";
import { tutorials } from "@/data/tutorials";
import { GITHUB_URL } from "@/lib/site-nav";

export const metadata = {
  title: "Guides & Walkthroughs",
  description:
    "Step-by-step tutorials for Sudar Studio, Learn, ALP, MCP, compliance, and self-hosting with animated wireframes.",
};

const adminTutorials = tutorials.filter((t) => t.audience === "admin");
const learnerTutorials = tutorials.filter((t) => t.audience === "learner");
const operatorTutorials = tutorials.filter((t) => t.audience === "operator");

export default function GuidesPage() {
  return (
    <ProseSection title="Guides & Walkthroughs" wide>
      <p className="text-lg text-foreground max-w-3xl">
        These tutorials mirror how Sudar works today: Studio authoring, Learn delivery, Intelligence
        backends, ALP plugins, and MCP connectors. Each guide includes an animated wireframe workflow
        you can step through at your own pace.
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/features" className="text-primary hover:underline font-medium">
          Full capability catalog →
        </Link>
        <Link href="/help/studio" className="text-primary hover:underline font-medium">
          Studio help articles →
        </Link>
        <Link href="/best-practices" className="text-primary hover:underline font-medium">
          Best practices →
        </Link>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
          GitHub repo →
        </a>
      </div>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold text-foreground">For L&D and Studio admins</h2>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminTutorials.map((t) => (
            <TutorialCard key={t.slug} tutorial={t} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold text-foreground">For learners</h2>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {learnerTutorials.map((t) => (
            <TutorialCard key={t.slug} tutorial={t} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold text-foreground">For operators and integrators</h2>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {operatorTutorials.map((t) => (
            <TutorialCard key={t.slug} tutorial={t} />
          ))}
        </div>
      </section>
    </ProseSection>
  );
}

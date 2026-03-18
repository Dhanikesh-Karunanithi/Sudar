import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";

export const metadata = {
  title: "Mission & Vision",
};

export default function MissionPage() {
  return (
    <ProseSection title="Mission & Vision">
      <p className="text-lg text-foreground">
        <em>Learns with you, for you.</em>
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Mission</h2>
      <p className="mt-2 text-foreground">
        Make high-quality, personalized learning available to every learner. Adaptive, intelligent education should
        not be limited to those who can afford expensive eLearning tools (Rise360, Articulate, Captivate).
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Vision</h2>
      <p className="mt-2 text-foreground">
        Sudar is an AI-native learning platform that adapts modality, pace, difficulty, and content in real time.
        One place to build courses, deliver them, and support every learner with a tutor that remembers.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">The Core Promise</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-card-border bg-card-bg shadow-card p-5">
          <h3 className="font-semibold text-accent">For learners</h3>
          <p className="mt-2 text-sm text-foreground">
            A personal AI tutor that remembers you, adapts to you, and never judges you.
          </p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg shadow-card p-5">
          <h3 className="font-semibold text-accent">For L&D teams and admins</h3>
          <p className="mt-2 text-sm text-foreground">
            Build training content without a full team. AI generates courses from documents and URLs; you edit and
            publish.
          </p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg shadow-card p-5">
          <h3 className="font-semibold text-accent">For organizations</h3>
          <p className="mt-2 text-sm text-foreground">
            A platform that connects learning outcomes to business outcomes, with full analytics and compliance
            tracking.
          </p>
        </div>
      </div>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/story" className="text-accent hover:underline">
          The Story →
        </Link>
        <Link href="/research" className="text-accent hover:underline">
          Research Foundation →
        </Link>
      </div>
    </ProseSection>
  );
}

import { ProseSection } from "@/components/ProseSection";
import Link from "next/link";
import { CONTACT_EMAIL, GITHUB_URL } from "@/lib/site-nav";

export const metadata = {
  title: "Call for Collaboration",
};

export default function CollaboratePage() {
  return (
    <ProseSection title="Call for Collaboration">
      <p className="text-lg text-foreground">
        We welcome institutions, organizations, and open-source contributors for pilots, plugin integrations, and
        community extensions.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Pilots</h2>
      <p className="mt-2 text-foreground">
        We are planning pilots with institutional and organizational partners: for example, a university using Moodle
        with the ALP connector (SudarMemory, SudarChat, SudarRecommend), or a mid-market company using Sudar Learn
        for mandatory or upskilling paths (e.g. 50–200 learners). Pilots will assess adoption, engagement, and
        learning outcomes. Data collection and success criteria are in <code>docs/PILOT_PLAN.md</code> in the repo.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Plugin integrations</h2>
      <p className="mt-2 text-foreground">
        The ALP API is documented and implemented. We welcome connectors for Canvas, Blackboard, or other LMSs. User
        mapping and event shapes are in <code>docs/ALP_API.md</code>. If you build a plugin or adapter, we would like
        to link to it or feature it in the community.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Research and community</h2>
      <p className="mt-2 text-foreground">
        The implementation is open source (Apache-2.0) and evidence-informed. We encourage citing the repository and
        RESEARCH_FOUNDATION.md when Sudar is used in studies or derivative work. New modalities, intelligence
        plugins, or integrations are welcome; open an issue or PR on GitHub.
      </p>
      <h2 className="mt-10 text-xl font-semibold text-foreground">Get in touch</h2>
      <p className="mt-2 text-foreground">
        Contact us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
          {CONTACT_EMAIL}
        </a>{" "}
        for pilot discussions, partnership ideas, or technical collaboration. Repository:{" "}
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          GitHub — Sudar
        </a>
        .
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/contact" className="text-accent hover:underline">
          Contact form →
        </Link>
        <Link href="/papers" className="text-accent hover:underline">
          Research Papers →
        </Link>
        <Link href="/alp" className="text-accent hover:underline">
          ALP & Plugins →
        </Link>
      </div>
    </ProseSection>
  );
}

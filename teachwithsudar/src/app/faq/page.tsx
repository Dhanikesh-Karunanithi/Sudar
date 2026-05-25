"use client";

import type { ReactNode } from "react";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import Link from "next/link";
import { GITHUB_URL } from "@/lib/site-nav";

type FaqItem = {
  id: string;
  q: string;
  content: ReactNode;
};

const faqLinkClass = "text-primary hover:underline font-medium";

const faqs: FaqItem[] = [
  {
    id: "what-is-sudar",
    q: "What is Sudar?",
    content: (
      <>
        Sudar is an open-source learning stack: Studio for authoring, Learn for delivery, and Intelligence
        for adaptive routing and tutoring. The same learner profile backs recommendations, modalities, and
        tutor memory. See the{" "}
        <Link href="/features" className={faqLinkClass}>
          features overview
        </Link>{" "}
        or{" "}
        <Link href="/story" className={faqLinkClass}>
          the story behind Sudar
        </Link>
        .
      </>
    ),
  },
  {
    id: "is-sudar-free",
    q: "Is Sudar free?",
    content: (
      <>
        The software is Apache-2.0. You can self-host on infrastructure you choose, our reference guide uses
        common hobby tiers for hosting and a Postgres-compatible database. You pay for your own database,
        hosting, and AI API usage. There is no mandatory Sudar license fee. Details:{" "}
        <Link href="/self-host" className={faqLinkClass}>
          Self-host at $0
        </Link>
        .
      </>
    ),
  },
  {
    id: "how-self-host",
    q: "How do I self-host?",
    content: (
      <>
        Deploy Studio and Learn as two Vercel projects (roots <code>sudar-studio</code> and{" "}
        <code>sudar-learn</code>), Intelligence to Railway/Render/Fly, and apply the Postgres migrations in
        your database. Step-by-step:{" "}
        <Link href="/guides/self-host-production" className={faqLinkClass}>
          Self-host and production deploy
        </Link>{" "}
        and{" "}
        <Link href="/self-host" className={faqLinkClass}>
          Self-host at $0
        </Link>
        .
      </>
    ),
  },
  {
    id: "mcp-chatgpt",
    q: "Can I use Sudar from ChatGPT or Cursor?",
    content: (
      <>
        Yes. Follow the{" "}
        <Link href="/guides/mcp-chatgpt-studio" className={faqLinkClass}>
          MCP + ChatGPT / Cursor guide
        </Link>
        . Production remote MCP is at{" "}
        <a
          href="https://mcp.thesudar.app"
          target="_blank"
          rel="noopener noreferrer"
          className={faqLinkClass}
        >
          mcp.thesudar.app
        </a>{" "}
        with OAuth; <code>@sudar/mcp-server</code> supports local stdio. Creator tools proxy Studio with your
        session.
      </>
    ),
  },
  {
    id: "moodle-plugin",
    q: "How do I connect Moodle or another LMS?",
    content: (
      <>
        Use the ALP API: SudarMemory (events), SudarChat (tutor), SudarRecommend (next action). Create an
        API key in Studio Integrations. Walkthrough:{" "}
        <Link href="/guides/alp-moodle-integration" className={faqLinkClass}>
          ALP + Moodle integration
        </Link>
        . API reference:{" "}
        <a
          href={`${GITHUB_URL}/blob/main/docs/ALP_API.md`}
          target="_blank"
          rel="noopener noreferrer"
          className={faqLinkClass}
        >
          ALP_API.md
        </a>{" "}
        on GitHub.
      </>
    ),
  },
  {
    id: "modalities",
    q: "Which learning modalities does Learn support?",
    content: (
      <>
        Read, Listen (TTS), Watch (video/SudarVid), Map, Cards (flashcards), plus SCORM delivery. SudarFeed
        and SudarPlay are on the roadmap. Learners switch per module. Full list:{" "}
        <Link href="/modalities" className={faqLinkClass}>
          Modalities
        </Link>
        .
      </>
    ),
  },
  {
    id: "personalization",
    q: "How does personalization work?",
    content: (
      <>
        Orgs enable features in Studio. Optional overlays (role explain, brief views) store on enrollments
        only, not in canonical module content. Learners may need to accept generative AI consent first. See{" "}
        <Link href="/features" className={faqLinkClass}>
          Features
        </Link>{" "}
        and{" "}
        <Link href="/research" className={faqLinkClass}>
          Research foundation
        </Link>
        .
      </>
    ),
  },
  {
    id: "languages",
    q: "Does Sudar support multiple languages?",
    content: (
      <>
        Yes. Learn and Studio ship 30+ UI locales. Learners set UI and content language on Memory; orgs can
        set a default UI locale. Tutor and TTS respect content language when configured. More in{" "}
        <Link href="/features" className={faqLinkClass}>
          Features
        </Link>
        .
      </>
    ),
  },
  {
    id: "data-storage",
    q: "Where is my data stored?",
    content: (
      <>
        In the database and region you operate. Studio and Learn connect to the same tenant. Learner profiles,
        events, and content stay under your control. Sudar does not host your production data. See{" "}
        <Link href="/privacy" className={faqLinkClass}>
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/help/article/trust/overview" className={faqLinkClass}>
          Trust &amp; privacy briefing
        </Link>
        .
      </>
    ),
  },
  {
    id: "privacy-gdpr",
    q: "What about privacy and GDPR/FERPA?",
    content: (
      <>
        You control retention and access. Read the{" "}
        <Link href="/help/article/trust/overview" className={faqLinkClass}>
          Trust &amp; privacy briefing
        </Link>
        , the{" "}
        <a
          href={`${GITHUB_URL}/tree/main/docs/trust`}
          target="_blank"
          rel="noopener noreferrer"
          className={faqLinkClass}
        >
          trust pack on GitHub
        </a>
        , and our{" "}
        <Link href="/privacy" className={faqLinkClass}>
          Privacy Policy
        </Link>
        . Tutor memory cadence can be limited or disabled per learner and org.
      </>
    ),
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        Frequently Asked Questions
      </h1>
      <p className="mb-10 text-foreground-muted max-w-2xl">
        Quick answers. For workflows with wireframes, see{" "}
        <Link href="/guides" className="text-primary hover:underline">
          Guides
        </Link>
        .
      </p>
      <Accordion>
        {faqs.map((faq) => (
          <AccordionItem key={faq.id} id={faq.id} title={faq.q}>
            <div className="text-foreground leading-relaxed">{faq.content}</div>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="mt-12 flex flex-wrap gap-6">
        <Link href="/guides" className="text-primary hover:underline font-medium">
          Guides →
        </Link>
        <Link href="/privacy" className="text-primary hover:underline font-medium">
          Privacy Policy →
        </Link>
        <Link href="/terms" className="text-primary hover:underline font-medium">
          Terms of Service →
        </Link>
        <Link href="/contact" className="text-primary hover:underline font-medium">
          Contact →
        </Link>
      </div>
    </div>
  );
}

"use client";

import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import Link from "next/link";

const faqs = [
  {
    id: "what-is-sudar",
    q: "What is Sudar?",
    a: "Sudar is an AI-native learning platform. It combines authoring (Studio), delivery (Learn), and adaptive intelligence (including an AI tutor with memory) in one open-source stack. Modality, pace, and content adapt in real time.",
  },
  {
    id: "is-sudar-free",
    q: "Is Sudar free?",
    a: "The software is open source (Apache-2.0). You can self-host at $0 using Vercel for Studio and Learn and Railway, Render, or Fly.io for Intelligence. You pay for your own Supabase and AI API usage. No mandatory fee.",
  },
  {
    id: "how-self-host",
    q: "How do I self-host?",
    a: "Deploy Studio and Learn as two Vercel projects (roots byteos-studio and byteos-learn), deploy Intelligence to Railway (or Render/Fly.io), and set BYTEOS_INTELLIGENCE_URL in both Vercel projects. Full steps: docs/VERCEL_DEPLOYMENT.md and docs/INTELLIGENCE_DEPLOYMENT.md in the repo. See the Self-Host at $0 page for the walkthrough.",
  },
  {
    id: "moodle-plugin",
    q: "How do I get the Moodle plugin?",
    a: "ALP plugins (SudarMemory, SudarChat, SudarRecommend) are documented in the repo. Moodle connector packages will be published via GitHub Releases when ready. You can integrate today by calling the ALP API from your LMS; see docs/ALP_API.md and the Plugins page.",
  },
  {
    id: "data-storage",
    q: "Where is my data stored?",
    a: "In your own Supabase project. Studio and Learn use the same instance. Learner profiles, events, and content stay in your tenant. We do not host or mine your data.",
  },
  {
    id: "privacy-gdpr",
    q: "What about privacy and GDPR/FERPA?",
    a: "You control retention and access; data lives in your Supabase project. The research paper covers privacy and governance (tenancy, view/correct, opt-out, FERPA/GDPR). See the Privacy Policy page for details.",
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="mb-10 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        Frequently Asked Questions
      </h1>
      <Accordion>
        {faqs.map((faq) => (
          <AccordionItem key={faq.id} id={faq.id} title={faq.q}>
            <p className="text-foreground leading-relaxed">{faq.a}</p>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="mt-12 flex flex-wrap gap-6">
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

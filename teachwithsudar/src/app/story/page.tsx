"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { JourneySteps } from "@/components/ui/JourneySteps";

export default function StoryPage() {
  const productSteps = [
    {
      number: "01",
      title: "Sudar Studio",
      description:
        "Where admins and creators build courses from documents, URLs, or prompts. AI generates structure and content. Publish to Learn when ready.",
    },
    {
      number: "02",
      title: "Sudar Learn",
      description:
        "Where learners take courses. Personalized dashboard, modality choice (text, audio, video, flashcards), and the AI tutor, all driven by a persistent learner profile.",
    },
    {
      number: "03",
      title: "Sudar Intelligence",
      description:
        "The backend: adaptive engine, learner memory, next-best-action, and the tutor \"Sudar\" with RAG over your content.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero + intro */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <motion.h1
          className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          The Story
        </motion.h1>
        <motion.p
          className="mt-6 text-lg leading-relaxed text-foreground"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          Sudar was built so that great learning technology is not limited to those who can afford expensive tools.
          One platform for authoring, delivery, and adaptive intelligence, for every learner and every organization.
        </motion.p>

        {/* Accordion: Why it exists + The product */}
        <motion.div
          className="mt-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Accordion>
            <AccordionItem id="why" title="Why it exists">
              <div className="space-y-4 text-foreground leading-relaxed">
                <p>
                  Most learning management systems serve the same content to everyone. They do not remember the
                  learner or adapt sequence, difficulty, or support. Research has long shown that adaptive instruction
                  and intelligent tutoring outperform one-size-fits-all delivery. Yet mainstream LMS products still
                  lack a longitudinal learner model and memory-aware tutoring. Systems that do adapt are often
                  research prototypes or narrow tools, not part of the same platform that hosts courses and compliance.
                </p>
                <p>
                  Sudar unifies authoring, delivery, and intelligence around a persistent learner profile. Every
                  learner gets adaptive, personalized support without leaving the platform.
                </p>
              </div>
            </AccordionItem>
            <AccordionItem id="product" title="The product">
              <div className="space-y-4 text-foreground leading-relaxed">
                <p>
                  Sudar has three surfaces that share one source of truth in Supabase: auth, learner profiles,
                  content, events, and analytics. The AI tutor &quot;Sudar&quot; is the learner-facing face of that
                  intelligence.
                </p>
                <p>
                  The project is open source (Apache-2.0). Repository:{" "}
                  <a
                    href="https://github.com/Dhanikesh-Karunanithi/Sudar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    github.com/Dhanikesh-Karunanithi/Sudar
                  </a>
                  . We welcome institutions, organizations, and contributors for pilots, plugin integrations, and
                  community extensions.
                </p>
              </div>
            </AccordionItem>
          </Accordion>
        </motion.div>

        {/* Three surfaces — Journey steps */}
        <div className="mt-16">
          <motion.h2
            className="text-xl font-semibold text-foreground sm:text-2xl"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
          >
            Three surfaces
          </motion.h2>
          <motion.p
            className="mt-2 text-foreground-muted"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            Studio, Learn, and Intelligence work together around one learner model.
          </motion.p>
          <div className="mt-10">
            <JourneySteps steps={productSteps} />
          </div>
        </div>

        {/* CTA links */}
        <motion.div
          className="mt-14 flex flex-wrap gap-6"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/mission" className="text-primary hover:underline font-medium">
            Mission & Vision →
          </Link>
          <Link href="/research" className="text-primary hover:underline font-medium">
            Research Foundation →
          </Link>
          <Link href="/collaborate" className="text-primary hover:underline font-medium">
            Collaborate →
          </Link>
        </motion.div>
      </section>
    </div>
  );
}

import { STUDIO_APP_URL, LEARN_APP_URL } from "@/lib/site-nav";

export type BlogReference = {
  title: string;
  authors?: string;
  year?: string;
  url: string;
  note?: string;
};

export type BlogSection =
  | { type: "paragraph"; heading?: string; body: string | string[]; cta?: { label: string; href: string } }
  | { type: "list"; heading?: string; items: string[]; ordered?: boolean }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "references"; heading?: string; refs: BlogReference[] }
  | { type: "steps"; heading?: string; steps: { title: string; body: string }[]; cta?: { label: string; href: string } }
  | { type: "pitch"; heading?: string; body: string | string[]; cta?: { label: string; href: string } };

export type BlogPost = {
  title: string;
  date: string;
  excerpt: string;
  readingTime: string;
  tags: string[];
  heroImage?: { src: string; alt: string };
  sections: BlogSection[];
  imageUrls?: string[];
};

export const blogPosts: Record<string, BlogPost> = {
  "15-minute-course": {
    title: "The 15-Minute Course Challenge: From Source Material to Published Training",
    date: "2026-03-01",
    readingTime: "9 min read",
    tags: ["Course authoring", "AI in L&D", "Rapid development"],
    excerpt:
      "How to turn a PDF, policy doc, or article into a structured, multimodal course, grounded in research on AI-assisted authoring and cognitive load.",
    heroImage: {
      src: "/blog/blog-15-minute-course-banner.png",
      alt: "Illustration of a learner uploading a PDF into Sudar Studio to create a course in 15 minutes",
    },
    sections: [
      {
        type: "paragraph",
        body: [
          "Corporate training teams face a paradox: stakeholders want more courses, faster, while learners expect polished, relevant content. Traditional authoring tools, Rise360, Storyline, Captivate, often require weeks of instructional design, media production, and review cycles before anything ships.",
          "Recent research on generative AI in education suggests a different path. A 2024 field study at IU International University found that an AI teaching assistant reduced average study time by roughly 27% across 40+ courses, not by cutting corners, but by personalizing support at scale ([Revolutionising Distance Learning](https://arxiv.org/html/2403.14642v1), arXiv:2403.14642). The implication for L&D is clear: speed and quality are not opposites when AI handles structure, drafting, and first-pass media while humans focus on accuracy and alignment.",
        ],
      },
      {
        type: "paragraph",
        heading: "What “15 minutes” actually means",
        body: [
          "The 15-minute challenge is not about producing a Hollywood-grade video course in a quarter hour. It is about collapsing the **first draft**: outline, module text, basic assessments, and a publishable structure, so you can iterate with real learners instead of debating slide decks in isolation.",
          "Richard Mayer’s Cognitive Theory of Multimedia Learning (CTML) reminds us that meaningful learning depends on how information is structured, not how long production took. Learners benefit when words and visuals are integrated deliberately ([Cambridge Handbook of Multimedia Learning](https://www.cambridge.org/core/books/cambridge-handbook-of-multimedia-learning/cognitive-theory-of-multimedia-learning/A49922ACB5BC6A37DDCCE4131AC217E5)). A fast first draft that follows sound structure beats a slow draft that is pretty but cognitively overloaded.",
        ],
      },
      {
        type: "list",
        heading: "Before you start: pick the right source",
        items: [
          "**Strong sources:** policy PDFs, product one-pagers, SOPs, internal wiki pages, webinar transcripts, or a well-written blog post with clear sections.",
          "**Weak sources:** slide decks with bullet fragments only, scanned images without OCR, or content that contradicts itself across pages.",
          "**Target length:** one learning objective per module, 3–7 modules for a micro-course, 8–15 minutes of learner time per module.",
          "**Approval path:** know who signs off (legal, SME, manager) before you publish, speed is wasted if the course ships to the wrong audience.",
        ],
      },
      {
        type: "steps",
        heading: "The 15-minute workflow",
        steps: [
          {
            title: "Minutes 0–2: Define the outcome",
            body: "Write one sentence: “After this course, the learner will be able to ___.” If you cannot finish that sentence, the source material is not ready. Tie the outcome to a business metric when possible (fewer support tickets, faster onboarding, compliance pass rate).",
          },
          {
            title: "Minutes 2–5: Import and generate structure",
            body: "Upload a PDF/DOCX or paste a URL into Sudar Studio. The AI reads the source, proposes an outline with modules and learning objectives, and drafts block-based content. Review the outline before accepting, reorder sections, merge duplicates, and delete fluff.",
          },
          {
            title: "Minutes 5–10: Edit for accuracy and cognitive load",
            body: "Skim each module for factual errors and jargon. Break long paragraphs into scannable chunks. Add one formative check (quiz or reflection prompt) per module, retrieval practice improves retention more than re-reading alone (Roediger & Butler, 2011; see also [ITS meta-analysis](https://doi.org/10.1037/a0037123)).",
          },
          {
            title: "Minutes 10–13: Add media and modality variety",
            body: "Search royalty-free images inside Studio (Pexels, Unsplash) or upload brand assets. You do not need custom video on day one, text + one relevant image per section satisfies Mayer’s multimedia principle for many topics. Optional: enable Listen (TTS) so auditory learners can consume the same content.",
          },
          {
            title: "Minutes 13–15: Publish and assign",
            body: "Publish to Sudar Learn. Assign to a pilot group (5–20 learners), set a due date if compliance requires it, and watch completion analytics in Studio. Treat this as v1, your best feedback will come from learner drop-off points and tutor questions.",
          },
        ],
      },
      {
        type: "quote",
        text: "People learn more deeply from words and pictures than from words alone.",
        attribution: "Richard E. Mayer, Cognitive Theory of Multimedia Learning",
      },
      {
        type: "paragraph",
        heading: "Common mistakes that slow teams down",
        body: [
          "**Perfectionism on v1.** Ship a tight micro-course, measure completion, then expand. Adaptive systems improve with learner data, a [2022 randomized trial on adaptive curriculum](https://arxiv.org/abs/2207.14003) (arXiv:2207.14003) showed higher completion when sequencing responded to learner behavior.",
          "**One modality only.** If every module is a 20-minute video, you exclude readers and listeners. Author once; deliver in text, audio, flashcards, and video from the same source.",
          "**No SME spot-check.** AI drafts are fast but can hallucinate policy details. A five-minute review by a subject-matter expert prevents costly errors in compliance training.",
        ],
      },
      {
        type: "list",
        heading: "Quality checklist (2 minutes before publish)",
        ordered: true,
        items: [
          "Learning objective is measurable and visible at the top of the course.",
          "Each module fits on one screen scroll (mobile preview).",
          "At least one knowledge check exists before the final module.",
          "Images support the text, they are not decorative stock photos.",
          "Brand terms, product names, and dates match the source document.",
        ],
      },
      {
        type: "references",
        refs: [
          {
            title: "Revolutionising Distance Learning: A Comparative Study of Learning Progress with AI-Driven Tutoring",
            authors: "IU International University research team",
            year: "2024 · arXiv:2403.14642",
            url: "https://arxiv.org/abs/2403.14642",
            note: "Evidence that generative AI tutoring can reduce study time ~27% while scaling across dozens of university courses.",
          },
          {
            title: "Raising Student Completion Rates with Adaptive Curriculum and Contextual Bandits",
            authors: "LinUCB adaptive ITS study",
            year: "2022 · arXiv:2207.14003",
            url: "https://arxiv.org/abs/2207.14003",
            note: "Randomized controlled trial showing adaptive sequencing improves completion and engagement vs. static paths.",
          },
          {
            title: "Intelligent Tutoring Systems and Learning Outcomes: A Meta-Analysis",
            authors: "Ma, Adesope, Nesbit & Liu",
            year: "2014 · Journal of Educational Psychology",
            url: "https://doi.org/10.1037/a0037123",
            note: "Foundational meta-analysis: ITS associated with g = 0.42 vs. teacher-led instruction and g = 0.57 vs. non-adaptive CBI.",
          },
          {
            title: "Cognitive Theory of Multimedia Learning",
            authors: "Richard E. Mayer",
            year: "Cambridge Handbook of Multimedia Learning",
            url: "https://www.cambridge.org/core/books/cambridge-handbook-of-multimedia-learning/cognitive-theory-of-multimedia-learning/A49922ACB5BC6A37DDCCE4131AC217E5",
            note: "Design principles for combining narration, visuals, and text without overloading working memory.",
          },
        ],
      },
      {
        type: "pitch",
        heading: "Try the 15-minute challenge in Sudar Studio",
        body: [
          "Sudar Studio turns documents and URLs into structured courses with AI-generated outlines, block editing, built-in media search, and one-click publish to Sudar Learn. Learners get modality choice (text, audio, video, flashcards) and an AI tutor with memory, so your fast first draft can still feel personal on delivery.",
          "Self-host on free tiers or run a pilot with your team. Start with one policy doc or onboarding guide and measure completion before investing in a full curriculum.",
        ],
        cta: { label: "Open Sudar Studio", href: STUDIO_APP_URL },
      },
    ],
  },

  "lnd-without-team": {
    title: "L&D Without a Team: A Research-Informed Playbook for Solo Practitioners",
    date: "2026-02-15",
    readingTime: "10 min read",
    tags: ["L&D strategy", "Solo practitioner", "AI authoring"],
    excerpt:
      "How one-person L&D functions can ship professional training, with evidence on adaptive systems, resource constraints, and where AI actually saves time.",
    heroImage: {
      src: "/blog/blog-lnd-without-team-banner.png",
      alt: "Illustration of a solo L&D manager juggling course design, analytics, and admin tasks",
    },
    sections: [
      {
        type: "paragraph",
        body: [
          "If you are the entire L&D department, or one of two people supporting hundreds of employees, you already know the job description is impossible on paper: needs analysis, instructional design, media production, LMS administration, analytics, compliance tracking, and stakeholder management. Industry data shows corporate e-learning is now standard (roughly 90% of companies offer online training), yet team sizes rarely scale with demand.",
          "The good news from learning science: you do not need a studio crew to produce effective training. Meta-analyses consistently show that well-designed digital instruction, especially adaptive and intelligent tutoring approaches, outperforms one-size-fits-all classroom delivery ([Ma et al., 2014](https://doi.org/10.1037/a0037123); [Wang et al., 2024](https://journals.sagepub.com/doi/10.1177/07356331241240459)). The constraint is not talent; it is workflow.",
        ],
      },
      {
        type: "paragraph",
        heading: "The solo L&D reality: where time actually goes",
        body: [
          "Practitioners wearing every hat typically spend 40–60% of their week on **administration** (LMS tickets, enrollments, reporting) rather than design. Another large slice goes to **stakeholder alignment**: meetings to define what “done” looks like. Actual content creation is often squeezed into evenings.",
          "The highest-leverage shift is separating **repeatable production** (drafting, formatting, media search) from **judgment work** (SME validation, tone, compliance sign-off). Generative AI is strongest at the first category. A 2025 review of AI-based intelligent tutoring systems notes growing adoption but calls for rigorous evaluation ([arXiv:2507.18882](https://arxiv.org/abs/2507.18882)), meaning you should measure outcomes, not just output volume.",
        ],
      },
      {
        type: "list",
        heading: "Four principles solo L&D can borrow from research",
        items: [
          "**Personalization beats production value.** A plain module that adapts sequence and offers tutor support often beats a glossy video course nobody finishes. AI-enabled adaptive learning showed a medium-to-large effect (g = 0.70) vs. non-adaptive instruction in a 2024 meta-analysis covering 45 studies ([Wang et al.](https://journals.sagepub.com/doi/10.1177/07356331241240459)).",
          "**Learner choice works when the path is adaptive.** A 2024 field study with 265 children found that combining learning-progress personalization with learner choice improved both outcomes and motivation, but choice alone hurt performance on linear paths ([arXiv:2402.01669](https://arxiv.org/abs/2402.01669)). Give options inside a smart structure, not a free-for-all.",
          "**Multimodal delivery is not vanity.** Mayer’s dual-channel theory: separate verbal and visual processing channels mean text-only courses under-serve many learners. Offer listen, read, and flashcard modes from one source.",
          "**Measure completion, not seat time.** MOOC medians hover around 12.6% completion ([Jordan, 2015](https://openpraxis.org/articles/10.55982/openpraxis.16.3.606); [Class Central, 2024](https://www.classcentral.com/report/mooc-stats-2024/)). Track module drop-off and fix the third module, not the intro animation.",
        ],
      },
      {
        type: "paragraph",
        heading: "A 90-day playbook for a team of one",
        body: "This is a realistic cadence, not a fantasy where you launch 50 courses per quarter.",
      },
      {
        type: "steps",
        heading: "Days 1–30: Stabilize and audit",
        steps: [
          {
            title: "Inventory what exists",
            body: "List every mandatory course, its completion rate, and last update date. Flag anything below 40% completion or older than 12 months.",
          },
          {
            title: "Pick one high-impact rewrite",
            body: "Choose the course with the worst completion that also matters legally or operationally (onboarding, safety, data handling). One win builds credibility.",
          },
          {
            title: "Automate admin where possible",
            body: "Compliance reminders, enrollment rules, and certificate templates should not consume design hours. Studio supports compliance views and email nudges for at-risk learners.",
          },
        ],
      },
      {
        type: "steps",
        heading: "Days 31–60: Ship v1 with AI-assisted authoring",
        steps: [
          {
            title: "Rebuild from source, not from slides",
            body: "Start from the authoritative PDF or wiki page. AI generates structure; you edit for voice and accuracy. Use templates for visual consistency, 14 built-in templates in Sudar replace custom design work.",
          },
          {
            title: "Pilot with 10–20 learners",
            body: "Before company-wide launch, run a pilot cohort. Collect qualitative feedback (“where did you get stuck?”) and quantitative drop-off by module.",
          },
          {
            title: "Add formative checks",
            body: "Short quizzes with immediate feedback beat passive scrolling. Struggle signals feed adaptive recommendations when Intelligence is connected.",
          },
        ],
      },
      {
        type: "steps",
        heading: "Days 61–90: Personalize and report",
        steps: [
          {
            title: "Enable modality choice",
            body: "Publish the same module in text and Listen (TTS). Track which modalities correlate with completion in your org, the answer varies by audience.",
          },
          {
            title: "Turn on the AI tutor for FAQs",
            body: "Course-specific tutor Q&A deflects repetitive Slack questions. Higher-ed deployments of course-grounded chatbots report 10,000+ interactions per term ([MDPI Education Sciences, 2025](https://www.mdpi.com/2227-7102/16/5/812)).",
          },
          {
            title: "Report in business language",
            body: "Stakeholders care about time-to-productivity, error rates, and audit pass rates, not “modules created.” Tie L&D metrics to one business KPI per quarter.",
          },
        ],
      },
      {
        type: "quote",
        text: "Allowing choices as a playful feature is beneficial only if the curriculum personalization is effective for the learner.",
        attribution: "Improved Performances and Motivation in ITS (2024 field study, arXiv:2402.01669)",
      },
      {
        type: "list",
        heading: "Tools and resources worth bookmarking",
        items: [
          "[Association for Talent Development (ATD)](https://www.td.org/), benchmarks and competency models for solo practitioners.",
          "[Learning Guild research library](https://www.learningguild.com/research), reports on authoring tools and learner engagement.",
          "[OECD Learning Compass 2030](https://www.oecd.org/education/2030-project/), frameworks for future-ready skills (useful for stakeholder conversations).",
          "[Sudar Research Foundation](/research), how Sudar maps evidence (adaptive paths, twin model, tutor memory) to product design.",
          "[ALP API docs](https://github.com/Dhanikesh-Karunanithi/Sudar/blob/main/docs/ALP_API.md), extend Moodle or an existing LMS if full migration is not feasible.",
        ],
      },
      {
        type: "references",
        refs: [
          {
            title: "The Efficacy of AI-Enabled Adaptive Learning Systems on Learner Outcomes: A Meta-Analysis",
            authors: "Wang, Huang, Sommer et al.",
            year: "2024 · Journal of Educational Computing Research",
            url: "https://journals.sagepub.com/doi/10.1177/07356331241240459",
            note: "g = 0.70 overall effect for AI adaptive systems; moderators include duration, discipline, and adaptive targets (navigation vs. assessment).",
          },
          {
            title: "Improved Performances and Motivation in ITS: Combining ML and Learner Choice",
            year: "2024 · arXiv:2402.01669",
            url: "https://arxiv.org/abs/2402.01669",
            note: "RCT with 265 learners, personalization + choice beats linear paths; choice alone can harm linear curricula.",
          },
          {
            title: "A Comprehensive Review of AI-based Intelligent Tutoring Systems",
            year: "2025 · arXiv:2507.18882",
            url: "https://arxiv.org/abs/2507.18882",
            note: "Systematic review 2010–2025 on ITS design, NLP, student modeling, and evaluation rigor.",
          },
          {
            title: "Intelligent Tutoring Systems and Learning Outcomes: A Meta-Analysis",
            authors: "Ma, Adesope, Nesbit & Liu",
            year: "2014",
            url: "https://doi.org/10.1037/a0037123",
            note: "107 effect sizes, ITS effective across K-12, higher ed, and multiple subject domains.",
          },
        ],
      },
      {
        type: "pitch",
        heading: "Built for practitioners who do everything",
        body: [
          "Sudar replaces the traditional stack, authoring tool + LMS + separate chatbot, with Studio, Learn, and Intelligence on one learner model. Generate courses from documents, publish multimodal content, track compliance, and give every learner a tutor that remembers prior sessions.",
          "You can self-host at $0 on common free tiers or connect Sudar to Moodle via the Adaptive Learning Layer (ALP) if migration is phased.",
        ],
        cta: { label: "Start with Sudar Studio", href: STUDIO_APP_URL },
      },
    ],
  },

  "why-learners-drop-off": {
    title: "Why Your Learners Aren't Finishing Courses (And What the Evidence Says to Do About It)",
    date: "2026-02-01",
    readingTime: "11 min read",
    tags: ["Completion rates", "Adaptive learning", "Learner engagement"],
    excerpt:
      "MOOC medians near 13% completion are not inevitable. Root causes, published research, and practical fixes, from modality mismatch to missing learner memory.",
    heroImage: {
      src: "/blog/blog-why-learners-drop-off-banner.png",
      alt: "Illustration of a learner stuck at 30% course progress with modules fading away",
    },
    sections: [
      {
        type: "paragraph",
        body: [
          "Low completion is the open secret of online learning. Aggregators tracking major MOOC platforms report a **median completion rate around 12.6%** ([Class Central MOOC Report](https://www.classcentral.com/report/mooc-stats-2024/); see also [Jordan, 2015](https://openpraxis.org/articles/10.55982/openpraxis.16.3.606)). That means roughly seven or eight of every ten enrolled learners never finish, even when content is free and from top universities.",
          "Before blaming “lazy learners,” look at the system. Completion is a design outcome, not a character trait. When researchers recalculate MOOC completion using **learner intent** (excluding casual browsers who never planned to finish), rates jump substantially, sometimes above 60% in specific cohorts ([Open Praxis, 2024](https://openpraxis.org/articles/10.55982/openpraxis.16.3.606)). Corporate mandatory training sits in between: higher than MOOC medians, but still dragged down by format mismatch, irrelevant content, and zero adaptation.",
        ],
      },
      {
        type: "paragraph",
        heading: "Five evidence-backed reasons learners quit",
        body: "These patterns appear across MOOC research, corporate LMS analytics, and intelligent tutoring studies.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "**Modality mismatch.** Mayer’s Cognitive Theory of Multimedia Learning shows learners process verbal and visual information through separate channels with limited capacity. A text-heavy compliance course fails auditory learners; a 45-minute video fails readers who need to skim and search. Offering text, audio, flashcards, and video from one authored source aligns with dual-channel design ([Mayer, CTML](https://www.cambridge.org/core/books/cambridge-handbook-of-multimedia-learning/cognitive-theory-of-multimedia-learning/A49922ACB5BC6A37DDCCE4131AC217E5)).",
          "**No adaptation to prior knowledge.** Advanced learners drop from boredom; novices drop from confusion. Intelligent tutoring meta-analyses find positive effects (g ≈ 0.27–0.42 in K-12 and broader samples) when systems model what the learner already knows ([arXiv:2511.04997](https://arxiv.org/abs/2511.04997); [Ma et al., 2014](https://doi.org/10.1037/a0037123)). Static paths treat everyone as identical.",
          "**No memory across sessions.** When a learner returns after a week and the platform treats them as new, motivation drops. Longitudinal tutor memory, referencing prior struggles and wins, is a core ITS design principle (VanLehn, 2011; [D'Mello & Graesser, 2024](https://arxiv.org/abs/2507.18882)).",
          "**Weak early momentum.** Survival analysis on large open courses finds that **speed of completing early activities** predicts final completion better than demographics alone ([ECEL 2023](https://papers.academic-conferences.org/index.php/ecel/article/view/2667)). If module 1 is a 30-minute wall of text, module 2 never starts.",
          "**No support at the moment of struggle.** Learners quit when stuck, not when busy. Generative AI tutors grounded in course content can reduce study time while keeping personalization ([arXiv:2403.14642](https://arxiv.org/abs/2403.14642)). A FAQ PDF linked at the bottom of page 47 is not support.",
        ],
      },
      {
        type: "quote",
        text: "Our model attained superior completion rates and significantly improved student engagement when compared to alternative approaches.",
        attribution: "Raising Student Completion Rates with Adaptive Curriculum (arXiv:2207.14003, RCT)",
      },
      {
        type: "paragraph",
        heading: "What actually moves completion rates",
        body: [
          "Adaptive sequencing is not hype. When implemented with learner models and rigorous evaluation, it changes outcomes. A 2022 randomized trial using contextual bandits (LinUCB) for exercise ordering reported **higher completion, lower skip rates, and increased study time** vs. a non-adaptive heuristic baseline ([arXiv:2207.14003](https://arxiv.org/abs/2207.14003)). A separate adaptive path navigation system (ALPN) reported ~8.2% better learning outcomes vs. knowledge-tracing baselines ([arXiv:2305.04475](https://arxiv.org/abs/2305.04475)).",
          "Community and cohort structure also matter outside pure adaptivity, industry analyses cite 65%+ completion when discussion and cohort pacing are present vs. 10–20% for isolated self-paced content. The lesson: **combine** social structure where feasible with **personalization** at the individual level.",
        ],
      },
      {
        type: "paragraph",
        heading: "A diagnostic you can run this week",
        body: "Pull analytics for your lowest-completion course and answer these questions:",
      },
      {
        type: "list",
        items: [
          "Where is the **steepest drop-off**? (Usually module 1 or the first quiz.)",
          "Average **time on module 1**: is it under 3 minutes (skim-and-quit) or over 20 (overload)?",
          "Do learners **switch modalities**, or is only one format available?",
          "How many **tutor or help-desk questions** repeat the same confusion point?",
          "Are completions concentrated among one department (suggesting relevance issue elsewhere)?",
        ],
      },
      {
        type: "steps",
        heading: "Fixes ranked by effort vs. impact",
        steps: [
          {
            title: "Quick win: shorten module 1 and add a win",
            body: "Cap intro modules at 5–8 minutes. End with a confidence-building check learners can pass. Early success predicts later completion in open-course survival models.",
          },
          {
            title: "Medium effort: enable multimodal delivery",
            body: "Publish the same content as Read + Listen + Flashcards. Track which modality correlates with completion for your audience.",
          },
          {
            title: "Medium effort: deploy a course-grounded tutor",
            body: "RAG-powered tutor over your modules answers “explain this” without leaving the flow. Course-specific chatbots in higher ed saw 10,000+ learner interactions in one deployment ([MDPI, 2025](https://www.mdpi.com/2227-7102/16/5/812)).",
          },
          {
            title: "Higher effort: adaptive path ordering",
            body: "Use learner event data (quiz scores, replays, pauses) to reorder or recommend next modules. Sudar’s next-best-action and adaptive path features implement this on the Digital Learner Twin.",
          },
          {
            title: "Strategic: measure intent, not just enrollments",
            body: "Separate “assigned and started” from “browsed catalog.” Report completion against intentional learners, stakeholders make better decisions with cleaner denominators ([Open Praxis MOOC study](https://openpraxis.org/articles/10.55982/openpraxis.16.3.606)).",
          },
        ],
      },
      {
        type: "paragraph",
        heading: "Completion is a lagging indicator of design quality",
        body: [
          "Chasing 100% completion on optional upskilling content is the wrong goal. Chasing **high completion on mandatory training that people actually learn from** is the right one. The research converges on a design stack: multimodal delivery, formative assessment, adaptive sequencing, and memory-aware support.",
          "Platforms that only track clicks and certificates, without a longitudinal learner model, cannot implement that stack. That gap is exactly why adaptive learning research outpaced mainstream LMS product design for two decades.",
        ],
      },
      {
        type: "references",
        refs: [
          {
            title: "Uncovering MOOC Completion: A Comparative Study of Completion Rates from Different Perspectives",
            year: "2024 · Open Praxis",
            url: "https://openpraxis.org/articles/10.55982/openpraxis.16.3.606",
            note: "Completion varies sharply by denominator, enrolled vs. active vs. intentional learners.",
          },
          {
            title: "Raising Student Completion Rates with Adaptive Curriculum and Contextual Bandits",
            year: "2022 · arXiv:2207.14003",
            url: "https://arxiv.org/abs/2207.14003",
            note: "RCT evidence for adaptive activity ordering improving completion and engagement.",
          },
          {
            title: "Adaptive Learning Path Navigation (ALPN) with Knowledge Tracing",
            year: "2023 · arXiv:2305.04475",
            url: "https://arxiv.org/abs/2305.04475",
            note: "Adaptive paths outperformed KT-KDM baselines on learning outcomes and path diversity.",
          },
          {
            title: "Do Intelligent Tutoring Systems Benefit K-12 Students? A Meta-Analysis",
            year: "2025 · arXiv:2511.04997",
            url: "https://arxiv.org/abs/2511.04997",
            note: "Significant positive effect (g = 0.271) across 18 U.S. K-12 ITS studies; moderators include worked examples and duration.",
          },
          {
            title: "Slow and Steady or Fast and Furious: Completion Duration Analysis",
            year: "2023 · European Conference on e-Learning",
            url: "https://papers.academic-conferences.org/index.php/ecel/article/view/2667",
            note: "Early activity completion speed predicts course completion better than demographics alone.",
          },
          {
            title: "Cognitive Theory of Multimedia Learning",
            authors: "Richard E. Mayer",
            url: "https://link.springer.com/article/10.1007/s10648-023-09842-1",
            note: "Updated review of CTML principles, dual channels, limited capacity, active processing.",
          },
        ],
      },
      {
        type: "pitch",
        heading: "See adaptive delivery in action",
        body: [
          "Sudar Learn gives each learner modality choice, a persistent Digital Learner Twin, next-best-action recommendations, and tutor Sudar, an AI tutor with longitudinal memory grounded in your course content. Studio shows where learners drop off so you can fix module 3 instead of guessing.",
          "Open a course in Learn, switch between Read and Listen, and ask the tutor to explain a concept you struggled with last session. That is the difference between content delivery and a learning system.",
        ],
        cta: { label: "Try Sudar Learn", href: LEARN_APP_URL },
      },
    ],
  },

  "multimodal-learning-design": {
    title: "Multimodal Learning Design: Why One Format Is Never Enough",
    date: "2026-03-15",
    readingTime: "8 min read",
    tags: ["Multimodal learning", "Instructional design", "Mayer CTML"],
    excerpt:
      "Dual-channel theory, the multimedia effect, and practical guidance for delivering the same course as text, audio, video, and flashcards, without quadrupling your workload.",
    heroImage: {
      src: "/blog/blog-multimodal-learning-design-banner.png",
      alt: "Illustration of a learner choosing between text, audio, video, and flashcard learning formats",
    },
    sections: [
      {
        type: "paragraph",
        body: [
          "Most corporate courses pick one format and stick with it: a PDF for compliance, a video series for onboarding, or a slide deck nobody reads. That choice feels efficient for the L&D team, one production pipeline, but it ignores how humans actually process information.",
          "Richard Mayer's Cognitive Theory of Multimedia Learning (CTML), building on Paivio's dual coding theory, holds that learners have **separate channels** for visual/pictorial and auditory/verbal processing, each with limited capacity ([Cambridge Handbook of Multimedia Learning](https://www.cambridge.org/core/books/cambridge-handbook-of-multimedia-learning/cognitive-theory-of-multimedia-learning/A49922ACB5BC6A37DDCCE4131AC217E5)). People learn more deeply from **words and pictures together** than from words alone, the multimedia principle that underpins modality-agnostic platforms like Sudar.",
        ],
      },
      {
        type: "paragraph",
        heading: "What “modality” means in practice",
        body: [
          "In learning science, modality refers to the sensory channel and presentation format: reading text, listening to narration, watching annotated video, interacting with flashcards, or exploring a visual map. These are not cosmetic skins on the same PDF, they activate different cognitive processes. Listening while commuting engages the verbal channel differently than scanning bullet points at a desk.",
          "A 2024 field study on intelligent tutoring found that **learner choice only helps when the underlying path is adaptive**: choice on a linear course can actually hurt outcomes ([arXiv:2402.01669](https://arxiv.org/abs/2402.01669)). The design pattern that works: offer modality choice **inside** a coherent learning structure, not as a random buffet.",
        ],
      },
      {
        type: "list",
        heading: "Four modalities that cover most corporate topics",
        items: [
          "**Read (text)**: Default for policy, procedures, and reference material. Best for skimming, searching, and learners who need to copy exact wording.",
          "**Listen (TTS audio)**: Converts the same module to audiobook-style delivery. Critical for field workers, commuters, and auditory processors. Edge-TTS and similar tools make this near-zero marginal cost.",
          "**Flashcards**: Retrieval practice extracted from module content. Roediger and Karpicke's testing effect research shows active recall beats passive re-reading for long-term retention.",
          "**Video / visual**: Use when spatial or procedural demonstration matters (equipment handling, software clicks). Pair narration with aligned visuals per Mayer's contiguity principle, not voice-over unrelated stock footage.",
        ],
      },
      {
        type: "quote",
        text: "Multimedia instructional messages that are designed in light of how the human mind works are more likely to lead to meaningful learning than those that are not.",
        attribution: "Richard E. Mayer, Cognitive Theory of Multimedia Learning",
      },
      {
        type: "steps",
        heading: "Author once, deliver many: a practical workflow",
        steps: [
          {
            title: "Structure content in blocks, not slides",
            body: "Write modules as titled sections with clear learning objectives. Block-based authoring (headings, paragraphs, callouts, checks) maps cleanly to text, TTS, cards, and video scripts.",
          },
          {
            title: "Add one visual anchor per section",
            body: "A diagram, screenshot, or relevant photo satisfies the pictorial channel without requiring a full video production team.",
          },
          {
            title: "Generate derivative formats from the source",
            body: "AI can produce flashcards and audio scripts from the same module text. Sudar Studio authors once; Sudar Learn exposes modality tabs per module.",
          },
          {
            title: "Track which modalities correlate with completion",
            body: "Log modality_switch events in your learning analytics. Some orgs see higher completion on Listen; others on Read. Let data inform defaults, not assumptions.",
          },
        ],
      },
      {
        type: "list",
        heading: "Design mistakes to avoid",
        items: [
          "**Redundancy overload**: Reading identical text aloud while it appears on screen increases cognitive load (Mayer's redundancy principle). Listen mode should complement, not duplicate word-for-word on screen simultaneously.",
          "**Modality without structure**: Offering five formats on a disorganized wiki is not multimodal design; it is chaos.",
          "**Video everything**: Video is the slowest format to update when policies change. Keep video for high-value demonstration; use text for volatile content.",
        ],
      },
      {
        type: "references",
        refs: [
          {
            title: "The Past, Present, and Future of the Cognitive Theory of Multimedia Learning",
            authors: "Richard E. Mayer",
            year: "2023 · Educational Psychology Review",
            url: "https://link.springer.com/article/10.1007/s10648-023-09842-1",
            note: "Authoritative review of CTML evolution, dual channels, generative processing, and design principles.",
          },
          {
            title: "Improved Performances and Motivation in ITS: Combining ML and Learner Choice",
            year: "2024 · arXiv:2402.01669",
            url: "https://arxiv.org/abs/2402.01669",
            note: "Learner choice + adaptive personalization improves outcomes; choice on linear paths can harm learning.",
          },
          {
            title: "Mental Representations: A Dual Coding Approach",
            authors: "Allan Paivio",
            year: "1986 · Oxford University Press",
            url: "https://www.cambridge.org/core/books/cambridge-handbook-of-multimedia-learning/cognitive-theory-of-multimedia-learning/A49922ACB5BC6A37DDCCE4131AC217E5",
            note: "Foundational dual coding theory, verbal and nonverbal representations with referential links.",
          },
        ],
      },
      {
        type: "pitch",
        heading: "One course, every modality",
        body: [
          "Sudar is modality-agnostic by design: author in Studio, deliver in Learn as Read, Listen, Flashcards, MindMap, Video, and more. Learners switch per module; the Digital Learner Twin records which formats drive engagement for each person.",
          "Start with an existing policy doc, publish it in text and Listen on day one, then add flashcards once you see where learners struggle.",
        ],
        cta: { label: "Explore Sudar modalities", href: "/modalities" },
      },
    ],
  },

  "ai-tutor-with-memory": {
    title: "AI Tutors That Remember: Why Longitudinal Context Beats Generic Chat",
    date: "2026-03-10",
    readingTime: "9 min read",
    tags: ["AI tutor", "Intelligent tutoring", "Generative AI"],
    excerpt:
      "Generic chatbots reset every session. Research on ITS, RAG, and generative AI tutoring shows why course-grounded tutors with learner memory outperform copy-paste workflows.",
    heroImage: {
      src: "/blog/blog-ai-tutor-with-memory-banner.png",
      alt: "Illustration of a learner chatting with an AI tutor that remembers prior sessions",
    },
    sections: [
      {
        type: "paragraph",
        body: [
          "Corporate L&D teams are experimenting with ChatGPT, Copilot, and similar tools for training support. The workflow is familiar: learner gets stuck, opens a new chat tab, pastes a paragraph from the course, asks a question, gets an answer, and tomorrow the chat has no idea who they are or what they struggled with yesterday.",
          "That is not intelligent tutoring. Intelligent tutoring systems (ITS) maintain a **learner model**: tracking knowledge state, misconceptions, and interaction history, to personalize each turn ([VanLehn, 2011](https://arxiv.org/abs/2507.18882); [D'Mello & Graesser, 2024](https://arxiv.org/abs/2507.18882)). Meta-analyses find ITS associated with positive learning effects vs. non-adaptive instruction (g ≈ 0.27–0.57 depending on comparison; [Ma et al., 2014](https://doi.org/10.1037/a0037123)). The differentiator is not the LLM brand, it is **longitudinal context plus course grounding**.",
        ],
      },
      {
        type: "paragraph",
        heading: "Three layers that separate a tutor from a chatbot",
        body: [
          "**Course grounding (RAG)**: The tutor retrieves relevant chunks from your actual module content before answering, reducing hallucination and keeping responses aligned with approved material. A 2025 higher-ed study of a course-specific chatbot (bioTutor) reported 10,000+ learner interactions with high perceived usefulness when grounded in a curated knowledge base ([MDPI Education Sciences](https://www.mdpi.com/2227-7102/16/5/812)).",
          "**Longitudinal memory**: Prior quiz scores, modules completed, tutor questions, and stated preferences persist in a learner profile. Session 5 should reference confusion from session 2 without the learner re-explaining.",
          "**Pedagogical behavior**: Good tutors scaffold, ask checking questions, and encourage, they do not dump essay-length answers. Sudar's tutor Sudar is tuned for concise, non-judgmental responses under 150 words unless the learner asks for more.",
        ],
      },
      {
        type: "list",
        heading: "What the research says about AI tutoring at scale",
        items: [
          "Generative AI tutoring reduced average study time by ~27% across 40+ university courses in a 2024 distance-learning study ([arXiv:2403.14642](https://arxiv.org/abs/2403.14642)).",
          "A 2025 systematic review of AI-based ITS (2010–2025) notes growing adoption but calls for rigorous evaluation design ([arXiv:2507.18882](https://arxiv.org/abs/2507.18882)).",
          "ITS meta-analysis (K-12 U.S., 2025) found significant positive effects (g = 0.271) with moderators including worked examples and intervention duration ([arXiv:2511.04997](https://arxiv.org/abs/2511.04997)).",
          "Generic LLM wrappers without learner modeling show mixed results, alignment with course content and persistence matter more than model size.",
        ],
      },
      {
        type: "quote",
        text: "Generative AI is expected to have a vast, positive impact on education; however, at present, this potential has not yet been demonstrated at scale at university level.",
        attribution: "Revolutionising Distance Learning (2024), before evidence of ~27% study-time reduction with AI tutoring",
      },
      {
        type: "steps",
        heading: "Implementing memory-aware tutoring in your org",
        steps: [
          {
            title: "Ground answers in approved content",
            body: "Connect the tutor to your course modules via RAG, not the open internet. Compliance and product training require answers traceable to source material.",
          },
          {
            title: "Log every tutor exchange",
            body: "Store ai_interactions with course ID, module ID, and learner ID. This feeds analytics (\"what are people confused about?\") and longitudinal memory.",
          },
          {
            title: "Set governance boundaries",
            body: "Org policies on what the tutor may discuss, sensitive-topic guardrails, and opt-out for learners who prefer no AI memory. Document retention in your privacy policy.",
          },
          {
            title: "Measure help that actually helps",
            body: "Track whether tutor usage correlates with module completion and quiz improvement, not just chat volume. High interaction with no completion lift suggests poor grounding or unhelpful responses.",
          },
        ],
      },
      {
        type: "list",
        heading: "ChatGPT for L&D vs. an integrated tutor",
        items: [
          "**ChatGPT**: General knowledge, no course RAG, no persistent learner model, no completion analytics, learners leave the learning environment.",
          "**LMS discussion forums**: Async, no personalization, often empty after week one.",
          "**Sudar tutor**: RAG over your content, Digital Learner Twin memory, proactive nudges when struggle signals fire, all inside the Learn course viewer.",
        ],
      },
      {
        type: "references",
        refs: [
          {
            title: "Revolutionising Distance Learning: AI-Driven Tutoring Study",
            year: "2024 · arXiv:2403.14642",
            url: "https://arxiv.org/abs/2403.14642",
            note: "~27% reduction in study time with generative AI teaching assistant across 40+ courses.",
          },
          {
            title: "A Comprehensive Review of AI-based Intelligent Tutoring Systems",
            year: "2025 · arXiv:2507.18882",
            url: "https://arxiv.org/abs/2507.18882",
            note: "Systematic review of ITS applications, student modeling, NLP, and evaluation challenges.",
          },
          {
            title: "A Lecture-Specific AI-Based Tutor for Higher Education",
            year: "2025 · MDPI Education Sciences",
            url: "https://www.mdpi.com/2227-7102/16/5/812",
            note: "Course-grounded chatbot with 10,000+ interactions; high usability and learning relevance scores.",
          },
          {
            title: "Intelligent Tutoring Systems and Learning Outcomes: A Meta-Analysis",
            authors: "Ma, Adesope, Nesbit & Liu",
            year: "2014",
            url: "https://doi.org/10.1037/a0037123",
            note: "107 effect sizes, ITS effective across levels and domains when properly designed.",
          },
        ],
      },
      {
        type: "pitch",
        heading: "Meet Sudar, the tutor that learns with you",
        body: [
          "Sudar Intelligence powers tutor Sudar inside Learn: RAG over your course content, longitudinal memory via the Digital Learner Twin, reactive Q&A and proactive help when struggle signals fire. Every exchange logs to ai_interactions for analytics and research.",
          "Try a course in Learn, ask Sudar about a concept, leave and come back, Sudar remembers the thread. That is the difference between a chatbot tab and a learning operating system.",
        ],
        cta: { label: "Try Sudar Learn", href: LEARN_APP_URL },
      },
    ],
  },
};

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts[slug];
}

export function getAllSlugs(): string[] {
  return Object.entries(blogPosts)
    .sort(([, a], [, b]) => b.date.localeCompare(a.date))
    .map(([slug]) => slug);
}

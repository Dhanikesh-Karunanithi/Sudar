import { STUDIO_APP_URL, LEARN_APP_URL } from "@/lib/site-nav";

export type BlogSection =
  | { type: "paragraph"; heading?: string; body: string; cta?: { label: string; href: string } }
  | { type: "steps"; steps: { title: string; body: string }[]; cta?: { label: string; href: string } };

export type BlogPost = {
  title: string;
  date: string;
  excerpt: string;
  sections: BlogSection[];
  imageUrls?: string[];
};

export const blogPosts: Record<string, BlogPost> = {
  "15-minute-course": {
    title: "The 15-Minute Course Challenge",
    date: "2026-03-01",
    excerpt: "Step-by-step: build a complete course in Sudar Studio from a document or URL, then publish to Learn.",
    imageUrls: ["/screenshots/studio-login.png", "/screenshots/learn-login.png"],
    sections: [
      {
        type: "paragraph",
        body: "You can go from a PDF or a URL to a published course in Sudar Learn in about 15 minutes. No instructional designer or video team required. Here is how.",
      },
      {
        type: "steps",
        steps: [
          {
            title: "Open Sudar Studio",
            body: "Go to Sudar Studio and sign in. From the dashboard you can create a new course.",
          },
          {
            title: "Create a course from a document or URL",
            body: "Choose “Create from document” (PDF, DOCX) or “Create from URL”. Paste the link or upload the file. The AI generates a course outline and module content.",
          },
          {
            title: "Review and edit the outline and modules",
            body: "You get an editable outline and block-based modules. Adjust structure, add or remove sections, and edit any module text.",
          },
          {
            title: "Add media if you want",
            body: "Use the built-in media search (Pexels, Unsplash, etc.) or upload your own. Drop images or video into the modules.",
          },
          {
            title: "Publish to Learn",
            body: "When you are happy with the course, publish it. It appears in Sudar Learn so learners can take it. You can assign it to teams or learning paths from Studio.",
          },
        ],
        cta: { label: "Try Sudar Studio", href: STUDIO_APP_URL },
      },
      {
        type: "paragraph",
        body: "To see the result as a learner, open Sudar Learn and enroll in the course. You can switch between text, audio, video, and flashcards per module.",
        cta: { label: "Try Sudar Learn", href: LEARN_APP_URL },
      },
    ],
  },
  "lnd-without-team": {
    title: "L&D Without a Team",
    date: "2026-02-15",
    excerpt:
      "Practical tips for solo L&D managers: AI course generation, templates, and media search so you can ship training on your own.",
    sections: [
      {
        type: "paragraph",
        body: "If you are the only L&D person (or one of very few), you still need to ship training that looks professional and works. Sudar is built so you can do that without a design team or a big budget.",
      },
      {
        type: "steps",
        steps: [
          {
            title: "Use AI course generation as your starting point",
            body: "Start from a document or URL. The AI gives you an outline and module content. You focus on editing and approval instead of writing from scratch.",
          },
          {
            title: "Use the 14 visual templates",
            body: "Pick a template that fits the topic. Templates keep the look consistent and save you from designing every screen.",
          },
          {
            title: "Use multi-source media search",
            body: "Search Pexels, Unsplash, Giphy, and the web from inside Studio. Add images and media without leaving the editor.",
          },
          {
            title: "Publish and iterate",
            body: "Get the course in front of learners quickly. Use analytics in Studio to see completions and drop-off, then adjust content or structure.",
          },
        ],
        cta: { label: "Try Sudar Studio", href: STUDIO_APP_URL },
      },
    ],
  },
  "why-learners-drop-off": {
    title: "Why Your Learners Aren't Finishing Courses",
    date: "2026-02-01",
    excerpt:
      "How one-size-fits-all content and missing modality choice hurt completion, and what changes with adaptive learning.",
    sections: [
      {
        type: "paragraph",
        body: "Low completion rates are common when everyone gets the same content in the same format. Three things usually play a role: modality mismatch, no adaptation to prior knowledge, and no memory of the learner across sessions.",
      },
      {
        type: "paragraph",
        heading: "What Sudar changes",
        body: "Sudar gives learners a choice of format (text, audio, video, flashcards, mindmap) per module so they can learn in the way that works for them. A persistent learner profile and an AI tutor with memory mean each session builds on the last. Next-best-action and adaptive path ordering help surface the right content at the right time.",
      },
      {
        type: "paragraph",
        body: "If you want to see the learner experience, open Sudar Learn and take a course. Try switching modalities and using the tutor.",
        cta: { label: "Try Sudar Learn", href: LEARN_APP_URL },
      },
    ],
  },
};

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts[slug];
}

export function getAllSlugs(): string[] {
  return Object.keys(blogPosts);
}

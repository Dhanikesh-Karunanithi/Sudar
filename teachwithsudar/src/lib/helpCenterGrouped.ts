import type { PublicHelpMeta } from "@/lib/helpCenterPublic";

const categoryLabels: Record<string, string> = {
  "start-here": "Start here",
  admins: "Studio & admins",
  learners: "Learners",
  "ai-literacy": "AI literacy",
  trust: "Trust & privacy",
  success: "Customer success",
};

export function groupHelpArticles(articles: PublicHelpMeta[]): { category: string; label: string; articles: PublicHelpMeta[] }[] {
  const map = new Map<string, PublicHelpMeta[]>();
  for (const a of articles) {
    const list = map.get(a.category) ?? [];
    list.push(a);
    map.set(a.category, list);
  }
  return [...map.entries()]
    .map(([category, items]) => ({
      category,
      label: categoryLabels[category] ?? category,
      articles: items.sort((x, y) => x.order - y.order || x.title.localeCompare(y.title)),
    }))
    .sort((a, b) => {
      const order = ["start-here", "admins", "learners", "ai-literacy", "trust", "success"];
      return order.indexOf(a.category) - order.indexOf(b.category);
    });
}

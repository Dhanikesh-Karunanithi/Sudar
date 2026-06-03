export const SITE_NAME = "Teach with Sudar";
export const GITHUB_URL = "https://github.com/Dhanikesh-Karunanithi/Sudar";
export const CONTACT_EMAIL = "connect@dhanikeshkarunanithi.com";

/** Production Sudar Studio — override at build time via NEXT_PUBLIC_STUDIO_APP_URL */
export const STUDIO_APP_URL =
  process.env.NEXT_PUBLIC_STUDIO_APP_URL?.replace(/\/$/, "") ||
  "https://studio.thesudar.com";

/** Production Sudar Learn — override at build time via NEXT_PUBLIC_LEARN_APP_URL */
export const LEARN_APP_URL =
  process.env.NEXT_PUBLIC_LEARN_APP_URL?.replace(/\/$/, "") ||
  "https://learn.thesudar.com";

/** Marketing site (this app) */
export const MARKETING_SITE_URL = "https://thesudar.com";
export const LEGACY_MARKETING_SITE_URL = "https://teachwithsudar.com";

export interface NavLink {
  href: string;
  label: string;
  external?: boolean;
}

export const navSections = {
  about: [
    { href: "/story", label: "The Story" },
    { href: "/mission", label: "Mission & Vision" },
    { href: "/research", label: "Research Foundation" },
    { href: "/papers", label: "Research Papers" },
  ] as NavLink[],
  product: [
    { href: "/features", label: "Features" },
    { href: "/guides", label: "Guides" },
    { href: "/modalities", label: "Modalities" },
    { href: "/alp", label: "ALP & Plugins" },
  ] as NavLink[],
  getStarted: [
    { href: "/self-host", label: "Self-Host at $0" },
    { href: "/plugins", label: "Plugin Downloads" },
    { href: "/monetize", label: "Make Money with Sudar" },
  ] as NavLink[],
  resources: [
    { href: "/blog", label: "Blog" },
    { href: "/updates", label: "Updates" },
    { href: "/edtech", label: "EdTech & AI" },
    { href: "/best-practices", label: "Best Practices" },
  ] as NavLink[],
  help: [
    { href: "/guides", label: "Guides & Walkthroughs" },
    { href: "/help/studio", label: "Studio Help" },
    { href: "/help/learn", label: "Learn Help" },
    { href: "/best-practices", label: "Best Practices" },
    { href: "/faq", label: "FAQ" },
  ] as NavLink[],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ] as NavLink[],
  community: [
    { href: "/collaborate", label: "Collaborate" },
    { href: "/contact", label: "Contact" },
  ] as NavLink[],
  extra: [
    { href: "/demo", label: "Demo" },
    { href: "/roadmap", label: "Roadmap" },
    { href: "/compare", label: "Compare" },
    { href: "/accessibility", label: "Accessibility" },
  ] as NavLink[],
};

export const allNavLinks: NavLink[] = [
  ...navSections.about,
  ...navSections.product,
  ...navSections.getStarted,
  ...navSections.resources,
  ...navSections.help,
  ...navSections.community,
  ...navSections.extra,
  ...navSections.legal,
];

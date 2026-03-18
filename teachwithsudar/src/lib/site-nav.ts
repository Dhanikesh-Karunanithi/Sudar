export const SITE_NAME = "Teach with Sudar";
export const GITHUB_URL = "https://github.com/Dhanikesh-Karunanithi/Sudar";
export const CONTACT_EMAIL = "connect@dhanikeshkarunanithi.com";
export const STUDIO_APP_URL = "https://sudar-studio.vercel.app";
export const LEARN_APP_URL = "https://sudar-learn.vercel.app";

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
    { href: "/help/studio", label: "Studio Help" },
    { href: "/help/learn", label: "Learn Help" },
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

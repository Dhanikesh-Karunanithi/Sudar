import Link from "next/link";
import { navSections, GITHUB_URL, CONTACT_EMAIL, SITE_NAME } from "@/lib/site-nav";

export function Footer() {
  const allLinks = [
    ...navSections.about,
    ...navSections.product,
    ...navSections.getStarted,
    ...navSections.resources,
    ...navSections.help,
    ...navSections.community,
  ];

  return (
    <footer className="py-16 md:py-20 border-t border-white/5 bg-[#050505] relative overflow-hidden">
      <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-10 md:gap-12">
          <div className="min-w-0">
            <h2 className="text-[clamp(2.5rem,10vw,6rem)] leading-[0.85] tracking-tighter text-white/10 font-bold select-none pointer-events-none font-serif">
              SUDAR.
            </h2>
          </div>

          <div className="flex flex-col gap-6 md:gap-8 md:text-right md:items-end">
            <nav className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-gray-400" aria-label="Footer">
              {allLinks.slice(0, 12).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-white transition-colors text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-500">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                GitHub
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="hover:text-white transition-colors"
              >
                Contact
              </a>
            </div>
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} {SITE_NAME}. Open source (Apache-2.0).
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

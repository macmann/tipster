import Head from 'next/head';
import Link from 'next/link';

const primaryLinks = [
  { href: '/', label: 'Matches' },
  { href: '/recommendations', label: 'Recommendations' },
  { href: '/rule-builder', label: 'Rule Builder' },
  { href: '/about', label: 'About' },
  { href: '/responsible-gambling', label: 'Responsible Betting' },
  { href: '/contact', label: 'Contact' }
];

const resourceLinks = [
  { href: '/editorial-standards', label: 'Editorial Standards' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/responsible-gambling', label: 'Responsible Play' },
  { href: '/about', label: 'Our Mission' }
];

const supportLinks = [
  {
    href: 'mailto:support@tipster.example',
    label: 'support@tipster.example'
  },
  {
    href: 'mailto:editorial@tipster.example',
    label: 'editorial@tipster.example'
  }
];

export default function Layout({ title, description, children }) {
  const pageTitle = title
    ? `${title} | Tipster Football Insights`
    : 'Tipster Football Insights';
  const metaDescription =
    description ||
    'Tipster provides in-depth football betting insights, match previews, and responsible gambling guidance backed by transparent analysis.';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
      </Head>
      <a
        href="#main-content"
        className="absolute left-2 top-2 z-50 -translate-y-full rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white focus:translate-y-0 focus:outline-none"
      >
        Skip to main content
      </a>
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row md:items-center md:justify-between">
            <div>
              <Link
                href="/"
                className="text-2xl font-semibold text-neutral-900 hover:text-neutral-700"
              >
                Tipster Football Insights
              </Link>
              <p className="mt-1 max-w-xl text-sm text-neutral-600">
                Expert commentary, data-driven previews, and practical betting guidance
                focused on the world&apos;s top football competitions.
              </p>
            </div>
            <nav aria-label="Primary" className="text-sm font-medium text-neutral-700">
              <ul className="flex flex-wrap gap-3">
                {primaryLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded px-2 py-1 transition-colors hover:bg-neutral-900 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/admin"
                    className="rounded px-2 py-1 text-neutral-500 transition-colors hover:bg-neutral-200"
                  >
                    Admin
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-10">
          {children}
        </main>
        <footer className="mt-16 bg-neutral-900 py-10 text-neutral-200">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 text-sm md:grid-cols-4">
            <section>
              <h2 className="text-base font-semibold text-white">About Tipster</h2>
              <p className="mt-3 leading-relaxed text-neutral-300">
                Tipster is curated by a collective of football analysts, traders, and writers who
                blend statistical modelling with on-the-ground knowledge. Every preview is
                written by a human editor and reviewed for accuracy, context, and responsible
                messaging before publication.
              </p>
            </section>
            <section>
              <h2 className="text-base font-semibold text-white">Resources</h2>
              <ul className="mt-3 space-y-2">
                {resourceLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="text-base font-semibold text-white">Editorial Promise</h2>
              <ul className="mt-3 space-y-2 text-neutral-300">
                <li>Original previews and guides written for passionate football fans.</li>
                <li>Transparent odds sourcing with context on limitations.</li>
                <li>Manual fact-checks before tips go live.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-base font-semibold text-white">Contact</h2>
              <p className="mt-3 text-neutral-300">
                We welcome feedback, corrections, and partnership requests. Reach our editors
                at:
              </p>
              <ul className="mt-3 space-y-2">
                {supportLinks.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <p className="mt-10 text-center text-xs text-neutral-500">
            © {new Date().getFullYear()} Tipster Football Insights. All rights reserved. Betting involves
            risk; please wager responsibly and only in jurisdictions where gambling is legal.
          </p>
        </footer>
      </div>
    </>
  );
}

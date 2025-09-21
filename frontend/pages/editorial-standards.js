import Layout from '@/components/Layout';

const STANDARDS = [
  {
    title: 'Original Reporting',
    details:
      'Every match preview is drafted by a human analyst. AI tools may assist with data extraction but never write or publish content without editorial oversight.'
  },
  {
    title: 'Source Transparency',
    details:
      'We cite all statistics and quotes, linking back to official league feeds, club statements, and bookmaker partners. Anonymous sources are used only when necessary and with approval from the editor-in-chief.'
  },
  {
    title: 'Conflict of Interest Policy',
    details:
      'Staff must disclose betting positions and are prohibited from covering matches where personal wagers could bias analysis.'
  }
];

const REVIEW_PROCESS = [
  'Analyst drafts the preview using the latest odds, injuries, and tactical notes.',
  'Editor performs a fact-check, reviews tone for responsible messaging, and ensures unique value.',
  'Responsible gambling advocate verifies that warnings and support links are present.',
  'Content is published with a timestamp and scheduled for follow-up review if markets move significantly.'
];

export default function EditorialStandardsPage() {
  return (
    <Layout
      title="Editorial Standards"
      description="Discover the rigorous editorial and compliance process Tipster uses to maintain high-quality football betting coverage."
    >
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-neutral-900">Editorial Standards</h1>
        <p className="mt-4 text-neutral-700">
          Tipster adheres to strict editorial and compliance guidelines so our readers can trust the
          analysis they receive. We reject low-value pages, spun content, and advertorials that do not
          provide clear utility. This policy works alongside Google&apos;s AdSense requirements to keep our
          platform transparent and trustworthy.
        </p>
        <p className="mt-4 text-neutral-700">
          Any reader can report an issue directly to editorial@tipster.example. Verified corrections are
          published within 24 hours along with an explanation of what changed and why.
        </p>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-3">
        {STANDARDS.map((item) => (
          <article key={item.title} className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900">{item.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">{item.details}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-neutral-900">Review Workflow</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-neutral-700">
          {REVIEW_PROCESS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-neutral-900">Advertising &amp; Monetisation</h2>
        <p className="mt-3 text-sm text-neutral-700">
          Tipster accepts advertising from regulated operators who agree to our responsible marketing
          pledge. Ads cannot obscure content or appear on pages without substantial editorial value. We
          reject pop-ups, autoplay audio, and other disruptive formats.
        </p>
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-neutral-900">Corrections Policy</h2>
        <p className="mt-3 text-sm text-neutral-700">
          If we publish an error, we update the article with a correction note detailing what changed. We
          maintain a changelog so regulators and partners can audit our processes. Readers can request
          corrections by emailing <a className="text-blue-700 underline" href="mailto:editorial@tipster.example">editorial@tipster.example</a>.
        </p>
      </section>
    </Layout>
  );
}

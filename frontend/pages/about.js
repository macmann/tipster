import Layout from '@/components/Layout';

const VALUES = [
  {
    title: 'Integrity First',
    description:
      'We refuse to publish “guaranteed” wins or accept payments that would compromise our recommendations. Every partnership is disclosed and vetted for compliance.'
  },
  {
    title: 'Education Over Sensationalism',
    description:
      'Tipster exists to help readers understand markets, not to chase viral wins. Articles emphasise process, variance, and bankroll discipline.'
  },
  {
    title: 'Community Accountability',
    description:
      'Feedback from readers, bookmakers, and regulators informs our updates. We respond to correction requests within one business day.'
  }
];

const TEAM = [
  {
    name: 'Amelia Thorne',
    role: 'Head of Editorial',
    bio: 'Former investigative sports journalist who now leads our editorial calendar and ensures all content passes fact-checks and compliance reviews.'
  },
  {
    name: 'Jonas Meyer',
    role: 'Lead Data Scientist',
    bio: 'Builds and maintains our predictive models, monitors edge decay, and produces the quantitative dashboards that power the Match Centre.'
  },
  {
    name: 'Priya Narayan',
    role: 'Responsible Gambling Advocate',
    bio: 'Certified counsellor who reviews every page for tone, responsible messaging, and links to support resources.'
  }
];

export default function AboutPage() {
  return (
    <Layout
      title="About Tipster"
      description="Learn about Tipster’s mission, editorial standards, and the team responsible for delivering thoughtful football betting coverage."
    >
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-neutral-900">Our Mission</h1>
        <p className="mt-4 text-neutral-700">
          Tipster launched as a passion project between football obsessives who believed betting media
          could be smarter, safer, and more transparent. We publish match previews, strategy explainers,
          and odds analysis so fans can make informed decisions—or simply enjoy the tactical nuances of
          the game. Monetisation never overrides integrity; ads and affiliate relationships are screened
          against the Google AdSense programme policies and our own ethical charter.
        </p>
        <p className="mt-4 text-neutral-700">
          Compliance is foundational. Each page includes meaningful content, unique analysis, and clear
          takeaways. When we use AI tools to support workflows, a human editor reviews the output before
          anything goes live to prevent low-value or duplicate pages.
        </p>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-3">
        {VALUES.map((value) => (
          <article key={value.title} className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900">{value.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">{value.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-neutral-900">Meet the Team</h2>
        <div className="mt-4 space-y-4">
          {TEAM.map((member) => (
            <div key={member.name} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <h3 className="text-lg font-semibold text-neutral-900">{member.name}</h3>
              <p className="text-sm font-medium text-neutral-700">{member.role}</p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-neutral-900">How We Stay Compliant</h2>
        <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm text-neutral-700">
          <li>Maintain an internal checklist mapped to AdSense and regional gambling regulations.</li>
          <li>Log every content review with timestamps, reviewer signatures, and source links.</li>
          <li>Archive original data feeds so that discrepancies can be audited quickly.</li>
          <li>Offer readers direct access to contact channels for corrections or responsible gaming support.</li>
        </ol>
      </section>
    </Layout>
  );
}

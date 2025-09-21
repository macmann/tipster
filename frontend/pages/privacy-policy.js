import Layout from '@/components/Layout';

const DATA_COLLECTION = [
  {
    title: 'Analytics',
    description:
      'We use privacy-friendly analytics to understand aggregate trends such as page views and device types. IP addresses are truncated and stored separately from behavioural insights.'
  },
  {
    title: 'Account Settings',
    description:
      'When you save betting rules or newsletter preferences we store only the data necessary to provide the service. You can request deletion at any time.'
  },
  {
    title: 'Communication Logs',
    description:
      'Emails sent to our support or editorial team are retained for up to 24 months to resolve queries and maintain compliance records.'
  }
];

const USER_RIGHTS = [
  'Request a copy of the personal information we hold about you.',
  'Update or correct inaccurate details by contacting support@tipster.example.',
  'Request deletion of your Tipster profile and stored rules, subject to legal retention requirements.',
  'Opt out of marketing communications at any time by following unsubscribe links.',
  'Submit complaints to your local data protection authority if you believe your rights have been breached.'
];

export default function PrivacyPolicyPage() {
  return (
    <Layout
      title="Privacy Policy"
      description="Understand how Tipster collects, uses, and safeguards your personal information in line with GDPR and global privacy standards."
    >
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-neutral-900">Privacy Policy</h1>
        <p className="mt-4 text-neutral-700">
          Tipster respects your privacy and complies with GDPR, CCPA, and other applicable regulations.
          We collect the minimum amount of personal data required to deliver match alerts, betting rule
          synchronisation, and support services. We do not sell your information or share it with third
          parties for advertising purposes.
        </p>
        <p className="mt-4 text-neutral-700">
          This policy explains what data we collect, why we collect it, how long we retain it, and the
          rights you have over your information. For any privacy-related inquiry contact
          privacy@tipster.example.
        </p>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-3">
        {DATA_COLLECTION.map((item) => (
          <article key={item.title} className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900">{item.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">{item.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-neutral-900">How We Use Your Data</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700">
          <li>Deliver customised match recommendations based on your saved rules.</li>
          <li>Send optional newsletters with editorial highlights and platform updates.</li>
          <li>Monitor site reliability, security threats, and fraudulent activity.</li>
          <li>Comply with legal obligations, including responsible gambling regulations.</li>
        </ul>
        <p className="mt-3 text-sm text-neutral-700">
          We retain personal data for as long as you maintain an active account, or longer if required by
          law. Anonymous analytics are stored for up to 36 months to understand long-term usage trends.
        </p>
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-neutral-900">Your Rights</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700">
          {USER_RIGHTS.map((right) => (
            <li key={right}>{right}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-neutral-900">Cookies and Tracking</h2>
        <p className="mt-3 text-sm text-neutral-700">
          Tipster uses strictly necessary cookies to maintain session state and remember your interface
          preferences. We do not use third-party advertising pixels. You can manage cookies through your
          browser settings or by using the controls provided in our footer.
        </p>
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-neutral-900">Contact Us</h2>
        <p className="mt-3 text-sm text-neutral-700">
          For privacy requests or complaints email <a className="text-blue-700 underline" href="mailto:privacy@tipster.example">privacy@tipster.example</a>.
          We respond within 72 hours and resolve verified data removal requests within 30 days.
        </p>
      </section>
    </Layout>
  );
}

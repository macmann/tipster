import Layout from '@/components/Layout';

const CONTACT_CHANNELS = [
  {
    title: 'Editorial Desk',
    email: 'editorial@tipster.example',
    purpose: 'Send news tips, correction requests, or inquiries about our publishing standards.'
  },
  {
    title: 'Support Team',
    email: 'support@tipster.example',
    purpose: 'Get help with saved rules, account settings, or privacy requests.'
  },
  {
    title: 'Partnerships',
    email: 'partners@tipster.example',
    purpose: 'Discuss responsible advertising opportunities that align with our compliance checklist.'
  }
];

export default function ContactPage() {
  return (
    <Layout
      title="Contact Tipster"
      description="Reach the Tipster editorial, support, or partnerships team. We aim to reply within one business day."
    >
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-neutral-900">Contact Us</h1>
        <p className="mt-4 text-neutral-700">
          We welcome feedback, correction requests, and collaboration ideas. Tipster is run by a small
          remote team across Europe and Asia; the inboxes listed below are actively monitored during
          business hours Monday through Friday. We do not provide betting tips over email—please use the
          Match Centre for the latest analysis.
        </p>
        <p className="mt-4 text-neutral-700">
          When contacting us include relevant context such as match names, timestamps, or account IDs so
          we can resolve your query quickly. Sensitive information is encrypted at rest and handled only
          by authorised team members.
        </p>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-3">
        {CONTACT_CHANNELS.map((channel) => (
          <article key={channel.title} className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900">{channel.title}</h2>
            <a className="mt-2 block text-sm font-medium text-blue-700 underline" href={`mailto:${channel.email}`}>
              {channel.email}
            </a>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">{channel.purpose}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-neutral-900">Media Kit &amp; Interviews</h2>
        <p className="mt-3 text-sm text-neutral-700">
          Journalists and podcast hosts can request press materials, expert commentary, or guest
          appearances from our analysts. Provide your publication name, deadlines, and talking points and
          we will connect you with the appropriate spokesperson.
        </p>
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-neutral-900">Office Hours</h2>
        <p className="mt-3 text-sm text-neutral-700">
          Our remote newsroom operates 09:00–18:00 GMT Monday to Friday. We monitor urgent responsible
          gambling requests outside these hours and escalate to the duty editor when necessary. For
          immediate help with problem gambling, please visit the resources listed in our Responsible
          Gambling hub.
        </p>
      </section>
    </Layout>
  );
}

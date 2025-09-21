import Layout from '@/components/Layout';
import RuleBuilder from '../components/RuleBuilder';

export default function RuleBuilderPage() {
  return (
    <Layout
      title="Custom Betting Rule Builder"
      description="Design personalised football betting filters, set odds thresholds, and learn how Tipster safeguards responsible staking."
    >
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-neutral-900">Create Your Betting Blueprint</h1>
        <p className="mt-4 text-neutral-700">
          The Rule Builder helps you codify a disciplined approach to football betting. Set minimum
          and maximum odds, value score thresholds, and preferred leagues so our recommendations
          align with your personal risk tolerance. Once saved, the filters sync with the Tipster feed
          and the Telegram bot for a consistent experience across devices.
        </p>
        <p className="mt-4 text-neutral-700">
          Treat these rules as a living document—review them monthly and after major bankroll swings.
          Clear parameters reduce emotional decisions and keep you compliant with responsible gaming
          practices.
        </p>
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <RuleBuilder userId="1" />
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <article className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">Best Practices for Setting Rules</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700">
            <li>Keep your odds range realistic. Markets below 1.40 or above 4.50 rarely align with long-term profitability.</li>
            <li>Stick to leagues you actively follow. Local knowledge boosts the quality of your qualitative notes.</li>
            <li>Document why you change a rule to build a personal audit trail and learn from past results.</li>
          </ul>
        </article>
        <aside className="rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
          Remember that even the best rule set cannot eliminate variance. Set deposit limits with
          your bookmaker, take cooling-off breaks, and never chase losses outside the parameters you
          defined here.
        </aside>
      </section>
    </Layout>
  );
}

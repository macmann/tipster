import Layout from '@/components/Layout';

const WARNING_SIGNS = [
  'Betting with money earmarked for essentials such as rent, food, or education.',
  'Feeling anxious or irritable when you cannot place a wager or when you reduce stake sizes.',
  'Chasing losses or increasing stakes dramatically after a losing streak.',
  'Hiding betting activity from friends, colleagues, or family members.',
  'Allowing betting to disrupt sleep, work, or relationships.'
];

const SUPPORT_RESOURCES = [
  { name: 'GamCare (UK)', link: 'https://www.gamcare.org.uk/' },
  { name: 'National Council on Problem Gambling (US)', link: 'https://www.ncpgambling.org/' },
  { name: 'Gambling Help Online (Australia)', link: 'https://www.gamblinghelponline.org.au/' },
  { name: 'Gamblers Anonymous', link: 'https://www.gamblersanonymous.org/' },
  { name: 'Your local regulator', link: 'https://www.gamblingcommission.gov.uk/contact-us' }
];

export default function ResponsibleGamblingPage() {
  return (
    <Layout
      title="Responsible Gambling"
      description="Tipster’s responsible gambling hub outlines bankroll management, warning signs of harm, and verified support organisations."
    >
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-neutral-900">Bet Smarter, Stay Safer</h1>
        <p className="mt-4 text-neutral-700">
          Tipster is committed to creating an environment where betting is treated as a form of
          entertainment, not a financial strategy. We align with the Google AdSense programme policies
          by ensuring that every page includes actionable advice, risk disclosures, and links to
          professional support. If you are under the legal gambling age in your jurisdiction, do not use
          this website.
        </p>
        <p className="mt-4 text-neutral-700">
          Betting should never compromise your wellbeing. Establish a monthly budget, set hard limits
          within your bookmaker account, and schedule regular self-assessments. The guidelines below can
          help you stay in control.
        </p>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <article className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">Bankroll Fundamentals</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700">
            <li>Only stake funds you can afford to lose after covering essential expenses.</li>
            <li>Limit each wager to 1–2% of your total bankroll to avoid volatile swings.</li>
            <li>Track every bet in a journal noting date, market, stake, odds, and rationale.</li>
            <li>Schedule “blackout days” with zero betting activity to reset emotionally.</li>
          </ul>
        </article>
        <article className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">Practical Safeguards</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700">
            <li>Enable deposit, loss, and session limits with your bookmaker.</li>
            <li>Use two-factor authentication to prevent unauthorised account access.</li>
            <li>Decline “VIP” or bonus offers that incentivise higher stakes beyond your comfort zone.</li>
            <li>Designate a friend or partner as an accountability buddy who can review your activity.</li>
          </ul>
        </article>
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-neutral-900">Warning Signs of Problem Gambling</h2>
        <p className="mt-3 text-sm text-neutral-700">
          Monitor your behaviour regularly. If you recognise any of the signs below, pause your betting
          immediately and seek professional support.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700">
          {WARNING_SIGNS.map((sign) => (
            <li key={sign}>{sign}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-neutral-900">Where to Get Help</h2>
        <p className="mt-3 text-sm text-neutral-700">
          Support is available in every major jurisdiction. Reach out to the organisations below or
          contact your national gambling regulator for assistance. Calls and chats are confidential.
        </p>
        <ul className="mt-3 space-y-2 text-sm text-neutral-700">
          {SUPPORT_RESOURCES.map((resource) => (
            <li key={resource.name}>
              <a
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline hover:text-blue-500"
              >
                {resource.name}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
        If you believe you or someone you know is in immediate danger, contact local emergency services.
        Tipster does not offer betting or financial services and cannot recover lost funds. We can,
        however, point you toward professional counsellors and regulatory bodies dedicated to safer
        gambling.
      </section>
    </Layout>
  );
}

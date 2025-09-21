import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';

const FAQ = [
  {
    question: 'What does the confidence of a recommendation mean?',
    answer:
      'Confidence is derived from how far our model price is from the market line and how consistent the participating teams have been over their last 10 fixtures. High confidence still requires discipline—never stake more than 2-3% of your bankroll.'
  },
  {
    question: 'How often are recommendations reviewed?',
    answer:
      'Editors reassess selections every morning and again two hours before kick-off. If team news or weather makes a pick less attractive, we publish an update or remove the recommendation entirely.'
  },
  {
    question: 'Do you cover every league?',
    answer:
      'We concentrate on competitions with reliable data coverage and liquidity. Lower-tier leagues appear only when we have recent scouting notes and trustworthy odds.'
  }
];

export default function Recommendations() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const userId = '1';

  useEffect(() => {
    async function fetchRecs() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:4000/recommend?userId=${userId}`);
        let data;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch recommendations');
        } else {
          data = await res.json();
        }
        setRecs(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchRecs();
  }, []);

  useEffect(() => {
    async function fetchAccuracy() {
      const today = new Date();
      let win = 0;
      let loss = 0;
      let roi = 0;
      for (let i = 1; i <= 3; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        try {
          const recRes = await fetch(`http://localhost:4000/recommend?userId=${userId}&date=${dateStr}`);
          const recs = recRes.ok ? await recRes.json() : [];
          const resultRes = await fetch(`http://localhost:4000/results?date=${dateStr}`);
          const results = resultRes.ok ? await resultRes.json() : { response: [] };
          const resultMap = new Map();
          (results.response || []).forEach(r => resultMap.set(r.fixture?.id, r));
          recs.forEach(r => {
            const match = resultMap.get(r.fixture?.id);
            if (!match) return;
            const home = match.goals?.home;
            const away = match.goals?.away;
            if (home == null || away == null) return;
            const odd = parseFloat(r.odd);
            if (home > away) {
              win++;
              if (!isNaN(odd)) roi += odd - 1;
            } else {
              loss++;
              roi -= 1;
            }
          });
        } catch (err) {
          // ignore
        }
      }
      setAccuracy({ win, loss, roi: roi.toFixed(2) });
    }
    fetchAccuracy();
  }, []);

  const renderOdds = (rec) => {
    return rec.odd ? rec.odd : 'N/A';
  };

  return (
    <Layout
      title="Football Betting Recommendations"
      description="See Tipster’s curated football betting picks, rationale, and recent performance with a responsible gambling focus."
    >
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Tipster Betting Recommendations</h1>
        <p className="mt-4 text-neutral-700">
          We publish selections only when qualitative scouting aligns with quantitative edge. Each
          recommendation highlights the market we&apos;re targeting, our fair price, and the supporting
          notes from the analyst on duty. If a match lacks a clear angle, we prefer to sit out—bankroll
          protection beats action for the sake of action.
        </p>
        <p className="mt-4 text-neutral-700">
          Below you&apos;ll find today&apos;s tips along with a rolling three-day performance summary. Treat
          these as educational insights rather than guarantees, and cross-check odds with a licensed
          bookmaker in your region before staking funds.
        </p>
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        {loading && <p className="text-sm text-neutral-600">Loading recommendations…</p>}
        {error && <p className="text-sm font-medium text-red-600">Error: {error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <caption className="pb-4 text-left text-sm font-medium text-neutral-700">
                Active picks are monitored until kick-off. We never exceed a 2% stake of the sample
                bankroll per play.
              </caption>
              <thead>
                <tr className="bg-neutral-100 text-neutral-800">
                  <th className="border border-neutral-200 px-3 py-2">League</th>
                  <th className="border border-neutral-200 px-3 py-2">Home</th>
                  <th className="border border-neutral-200 px-3 py-2">Away</th>
                  <th className="border border-neutral-200 px-3 py-2">Kick-off</th>
                  <th className="border border-neutral-200 px-3 py-2">Recommendation</th>
                  <th className="border border-neutral-200 px-3 py-2">Odds Snapshot</th>
                  <th className="border border-neutral-200 px-3 py-2">Analyst Notes</th>
                </tr>
              </thead>
              <tbody>
                {recs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-neutral-200 px-3 py-4 text-center text-neutral-600">
                      No recommendations are live at the moment. Explore our methodology, bankroll tips,
                      and responsible gambling guides below while we prepare new insights.
                    </td>
                  </tr>
                ) : (
                  recs.map((r) => (
                    <tr key={r.fixture?.id} className="border border-neutral-200">
                      <td className="px-3 py-2">{r.league?.name || '-'}</td>
                      <td className="px-3 py-2">{r.teams?.home?.name || '-'}</td>
                      <td className="px-3 py-2">{r.teams?.away?.name || '-'}</td>
                      <td className="px-3 py-2">
                        {r.fixture?.date ? new Date(r.fixture.date).toLocaleString() : '-'}
                      </td>
                      <td className="px-3 py-2">{r.recommendedBet || 'Home Win'}</td>
                      <td className="px-3 py-2">{renderOdds(r)}</td>
                      <td className="px-3 py-2">{r.rationale || 'Awaiting analyst commentary.'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {accuracy && (
        <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">Recent Accuracy (Last 3 Days)</h2>
          <p className="mt-3 text-sm text-neutral-700">
            Wins: {accuracy.win} · Losses: {accuracy.loss} · ROI (1 unit stakes): {accuracy.roi}
          </p>
          <p className="mt-2 text-sm text-neutral-700">
            Historical performance is not a guarantee of future returns. Variance is part of sports
            betting—maintain a disciplined staking plan and avoid chasing losses.
          </p>
        </section>
      )}

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <article className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">How We Vet Recommendations</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-neutral-700">
            <li>
              Shortlist matches with meaningful liquidity and news coverage to avoid stale lines.
            </li>
            <li>Cross-reference projections with opposition styles and expected line-ups.</li>
            <li>
              Apply a responsible betting lens—if value depends on aggressive staking, we pass on the
              selection.
            </li>
          </ol>
        </article>
        <aside className="rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
          Tipster is an educational platform. If betting stops being fun or you feel pressured to
          recover losses, step away and seek help from a licensed support organisation such as
          GamCare (UK), NCPG (US), or your national helpline. Set deposit limits and never wager
          money earmarked for essential expenses.
        </aside>
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-neutral-900">Frequently Asked Questions</h2>
        <div className="mt-4 space-y-3">
          {FAQ.map((item) => (
            <details key={item.question} className="rounded border border-neutral-200 bg-neutral-50 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-neutral-900">
                {item.question}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </Layout>
  );
}

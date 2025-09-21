import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Markdown from '../../components/Markdown';

export default function MatchDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    async function fetchMatch() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:4000/match/${id}`);
        let data;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch match');
        } else {
          data = await res.json();
        }
        setMatch(data);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchMatch();
  }, [id]);

  const fetchPrediction = async () => {
    try {
      const res = await fetch(
        `http://localhost:4000/match/${id}/refresh-prediction`,
        { method: 'POST' }
      );
      let data;
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to refresh prediction');
      } else {
        data = await res.json();
      }
      setMatch((prev) => ({ ...prev, aiPrediction: data.prediction }));
    } catch (err) {
      setError(err.message || 'Failed to fetch prediction');
    }
  };

  const renderBets = () => {
    const bookmakers = match?.odds?.[0]?.bookmakers || [];
    if (bookmakers.length === 0) return <p>No odds available.</p>;
    return (
      <div className="space-y-4">
        {bookmakers.map((bm) => (
          <div key={bm.id || bm.name} className="border p-2 rounded">
            <h3 className="font-semibold mb-2">{bm.name}</h3>
            {(bm.bets || []).map((bet) => (
              <div key={bet.id} className="mb-2">
                <div className="font-medium">{bet.name}</div>
                <ul className="list-disc ml-5">
                  {(bet.values || []).map((v, idx) => (
                    <li key={idx}>{`${v.handicap || v.value || v.name}: ${v.odd}`}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout
      title="Match Odds & Betting Analysis"
      description="Dive into the full Tipster preview for your selected football match, including AI suggestions, human commentary, and bookmaker odds."
    >
      {loading && <p className="text-sm text-neutral-600">Loading match details…</p>}
      {error && <p className="text-sm font-medium text-red-600">Error: {error}</p>}
      {match && (
        <article className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
          <header>
            <p className="text-sm uppercase tracking-wide text-neutral-500">
              {match.league?.name}
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-neutral-900">
              {match.teams?.home?.name} vs {match.teams?.away?.name}
            </h1>
            <p className="mt-2 text-neutral-700">
              Kick-off: {match.fixture?.date ? new Date(match.fixture.date).toLocaleString() : 'TBD'}
            </p>
          </header>

          <section className="rounded border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900">AI Perspective</h2>
            <p className="mt-2 text-neutral-700">
              AI summaries provide a quick synopsis of market value, but editors must review them
              before tips go live. Use the refresh button to pull the latest machine assessment and
              compare it with the human write-up below.
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-medium text-neutral-800">Automated insight</span>
              <button
                className="text-sm font-medium text-blue-700 underline"
                onClick={fetchPrediction}
              >
                {match.aiPrediction ? 'Refresh AI prediction' : 'Generate AI insight'}
              </button>
            </div>
            <div className="mt-3 rounded border border-neutral-200 bg-white p-3">
              <Markdown text={match.aiPrediction || 'AI insight pending editorial approval.'} />
            </div>
          </section>

          <section className="rounded border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900">Human Analyst View</h2>
            <p className="mt-2 italic">
              {match.humanPrediction ||
                'Our analysts are reviewing the latest news. Check back closer to kick-off for the official recommendation.'}
            </p>
            <p className="mt-4 text-neutral-700">
              Tipster previews prioritise context—squad rotation, travel fatigue, tactical setups, and
              historical match-ups. We only publish a betting angle when both the data and the human
              eye test align.
            </p>
          </section>

          <section className="rounded border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900">Bookmaker Odds Overview</h2>
            <p className="mt-2 text-neutral-700">
              Compare prices from multiple licensed bookmakers. Odds listed here are snapshots; verify
              current numbers directly with your bookmaker, and log any significant movement in your
              betting diary.
            </p>
            <div className="mt-4 space-y-4">{renderBets()}</div>
          </section>

          <section className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            Betting is never risk-free. Stake responsibly, set time-outs within your sportsbook account,
            and seek support from organisations such as Gamblers Anonymous or local helplines if you
            feel control slipping. Tipster exists to educate, not to encourage reckless wagering.
          </section>
        </article>
      )}
    </Layout>
  );
}

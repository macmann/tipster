import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Markdown from '../components/Markdown';

const TABS = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  week: 'This Week',
};

export default function Admin() {
  const [tab, setTab] = useState('today');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedMatches, setExpandedMatches] = useState({});
  const [inputs, setInputs] = useState({});

  useEffect(() => {
    async function fetchMatches() {
      setLoading(true);
      setError(null);
      try {
        const endpoint = tab === 'week' ? 'matches-week' : `matches-${tab}`;
        const res = await fetch(`http://localhost:4000/${endpoint}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch matches');
        }
        const data = await res.json();
        setMatches(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, [tab]);

  const handleInputChange = (id, value) => {
    setInputs((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = async (e, fixtureId) => {
    e.stopPropagation();
    const prediction = inputs[fixtureId];
    try {
      const res = await fetch(`http://localhost:4000/match/${fixtureId}/human-prediction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prediction }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save prediction');
      }
      const data = await res.json();
      setMatches((prev) =>
        prev.map((m) =>
          m.fixture?.id === fixtureId
            ? { ...m, humanPrediction: data.humanPrediction }
            : m
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const renderOdds = (match) => {
    const values = match.odds?.[0]?.bookmakers?.[0]?.bets?.[0]?.values || [];
    return values.map((v) => `${v.value || v.name}: ${v.odd}`).join(', ') || 'N/A';
  };

  return (
    <Layout
      title="Editorial Control Room"
      description="Tipster editors review AI outputs, add human betting commentary, and ensure every match preview meets our quality standards."
    >
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-neutral-900">Editorial Control Room</h1>
        <p className="mt-4 text-neutral-700">
          This workspace is reserved for Tipster analysts who validate AI summaries, update human
          predictions, and flag discrepancies in bookmaker feeds. Every change is logged, ensuring a
          transparent audit trail should we need to justify a recommendation to readers or partners.
        </p>
        <p className="mt-4 text-neutral-700">
          While this interface is primarily for internal use, we keep it accessible so auditors can
          confirm that each match tip passes through a manual review before reaching the public site.
          Low-value or AI-only pages are explicitly rejected during this process.
        </p>
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {Object.entries(TABS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-neutral-600">
          Choose a timeframe to review fixtures. When AI content appears, an editor must provide a
          human summary before the recommendation is published on consumer-facing pages.
        </p>
        {loading && <p className="mt-4 text-sm text-neutral-600">Loading fixtures…</p>}
        {error && <p className="mt-4 text-sm font-medium text-red-600">Error: {error}</p>}
        {!loading && !error && (
          matches.length === 0 ? (
            <p className="mt-4 rounded border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-700">
              No fixtures require review at the moment. Editors use this downtime to update long-form
              betting guides and evergreen resources so that every visit to Tipster delivers substance.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {matches.map((m) => (
                <article
                  key={m.fixture?.id}
                  className="cursor-pointer rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
                  onClick={() =>
                    setExpandedMatches((prev) => ({
                      ...prev,
                      [m.fixture?.id]: !prev[m.fixture?.id]
                    }))
                  }
                >
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {m.teams?.home?.name || '-'} vs {m.teams?.away?.name || '-'}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {m.fixture?.date
                      ? new Date(m.fixture.date).toLocaleString()
                      : 'Kick-off time TBD'}
                  </p>
                  <p className="mt-2 text-sm text-neutral-700">Odds snapshot: {renderOdds(m)}</p>
                  {expandedMatches[m.fixture?.id] && (
                    <div className="mt-3 space-y-3 text-sm text-neutral-700">
                      <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
                        <h4 className="font-semibold text-neutral-800">AI Summary</h4>
                        <Markdown text={m.aiPrediction || 'AI insight pending review.'} />
                      </div>
                      <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
                        <p className="font-semibold text-neutral-800">Human Prediction</p>
                        <p className="mt-1 italic">{m.humanPrediction || 'Not yet provided.'}</p>
                      </div>
                      <label className="block text-sm font-medium text-neutral-800" htmlFor={`prediction-${m.fixture?.id}`}>
                        Update human commentary
                      </label>
                      <textarea
                        id={`prediction-${m.fixture?.id}`}
                        className="h-28 w-full rounded border border-neutral-300 p-2"
                        value={inputs[m.fixture?.id] ?? m.humanPrediction ?? ''}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleInputChange(m.fixture?.id, e.target.value)}
                      />
                      <button
                        className="rounded border border-neutral-300 bg-neutral-900 px-3 py-1 text-sm font-medium text-white hover:bg-neutral-700"
                        onClick={(e) => handleSave(e, m.fixture.id)}
                      >
                        Save update
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )
        )}
      </section>
    </Layout>
  );
}

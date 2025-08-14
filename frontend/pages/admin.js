import { useState, useEffect } from 'react';
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
    <div className="p-4">
      <nav className="mb-4">
        <a href="/" className="mr-2">Matches</a>
        |
        <a href="/recommendations" className="mx-2">Recommendations</a>
        |
        <a href="/rule-builder" className="ml-2">Rule Builder</a>
        |
        <a href="/admin" className="ml-2">Admin</a>
      </nav>
      <h1 className="text-center text-2xl font-semibold mb-4">Admin Predictions</h1>
      <div className="flex justify-center gap-2 mb-4">
        {Object.entries(TABS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-2 py-1 border rounded ${
              tab === key ? 'bg-neutral-800 text-white' : 'bg-neutral-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {!loading && !error && (
        matches.length === 0 ? (
          <p>No matches available.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((m) => (
              <div
                key={m.fixture?.id}
                className="border p-2 rounded shadow cursor-pointer"
                onClick={() =>
                  setExpandedMatches((prev) => ({
                    ...prev,
                    [m.fixture?.id]: !prev[m.fixture?.id],
                  }))
                }
              >
                <h3 className="font-semibold">
                  {m.teams?.home?.name || '-'} vs {m.teams?.away?.name || '-'}
                </h3>
                <p className="text-sm">
                  {m.fixture?.date ? new Date(m.fixture.date).toLocaleString() : '-'}
                </p>
                <p className="text-sm mb-1">Odds: {renderOdds(m)}</p>
                {expandedMatches[m.fixture?.id] && (
                  <div>
                    <div className="italic mb-2">
                      <div>AI Prediction:</div>
                      <Markdown text={m.aiPrediction || 'N/A'} />
                    </div>
                    <p className="italic mb-2">Human Prediction: {m.humanPrediction || 'N/A'}</p>
                    <textarea
                      className="w-full border p-1 mb-2"
                      value={inputs[m.fixture?.id] ?? m.humanPrediction ?? ''}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleInputChange(m.fixture?.id, e.target.value)}
                    />
                    <button
                      className="px-2 py-1 border rounded"
                      onClick={(e) => handleSave(e, m.fixture.id)}
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { getMyanmarBet } from '../utils/myanmarOdds';
import Markdown from '../components/Markdown';

const TABS = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  week: 'This Week'
};

export default function Home() {
  const [tab, setTab] = useState('today');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [leagueFilter, setLeagueFilter] = useState('');
  const [leagues, setLeagues] = useState([]);
  const [withOddsOnly, setWithOddsOnly] = useState(true);
  const [expandedMatches, setExpandedMatches] = useState({});
  const [aiModal, setAiModal] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const AI_PROMPT =
    'You are a AI assistant to analyze the football match based on past meeting, scores, current status of team, and the odds and give recommandation and analysis for the user';

  useEffect(() => {
    async function fetchMatches() {
      setLoading(true);
      setError(null);
      try {
        const endpoint =
          tab === 'week'
            ? 'matches-week'
            : `matches-${tab}`;
        const res = await fetch(`http://localhost:4000/${endpoint}`);
        let data;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch matches');
        } else {
          data = await res.json();
        }
        const arr = Array.isArray(data) ? data : [];
        setMatches(arr);
        const uniqueLeagues = Array.from(
          new Set(arr.map((m) => m.league?.name).filter(Boolean))
        );
        setLeagues(uniqueLeagues);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, [tab]);

  const renderOdds = (match) => {
    const values =
      match.odds?.[0]?.bookmakers?.[0]?.bets?.[0]?.values || [];
    return values
      .map((v) => `${v.value || v.name}: ${v.odd}`)
      .join(', ') || 'N/A';
  };

  const renderAllOdds = (match) => {
    const bookmakers = match.odds?.[0]?.bookmakers || [];
    if (bookmakers.length === 0) return <p>No odds available.</p>;
    return (
      <div className="mt-2 space-y-4">
        {bookmakers.map((bm) => (
          <div key={bm.id || bm.name} className="border p-2 rounded">
            <h4 className="font-semibold mb-1">{bm.name}</h4>
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

  const renderAsianHandicap = (match) => {
    const books = match.odds?.[0]?.bookmakers || [];
    for (const b of books) {
      const bet = (b.bets || []).find((x) =>
        (x.name || '').toLowerCase().includes('asian handicap')
      );
      if (bet && bet.values) {
        return (
          bet.values
            .map((v) => `${v.handicap || v.value || v.name}: ${v.odd}`)
            .join(', ') || 'N/A'
        );
      }
    }
    return 'N/A';
  };

  const renderMyanmarBet = (match) => {
    let bet = match.myanmarBet;
    if (!bet && match.odds) {
      try {
        bet = getMyanmarBet(match.odds);
      } catch (_) {
        // ignore parsing errors
      }
    }
    if (!bet) return 'N/A';
    return `${bet.type} (${bet.handicap})`;
  };

  const buildAiContext = (match) => {
    const baseInfo = [
      `Match: ${match.teams?.home?.name || '-'} vs ${match.teams?.away?.name || '-'}`,
      `League: ${match.league?.name || '-'}`,
      `Kickoff: ${
        match.fixture?.date ? new Date(match.fixture.date).toLocaleString() : '-'
      }`,
      `Odds: ${renderOdds(match)}`
    ].join('\n');
    const fullOdds = JSON.stringify(match.odds || {}, null, 2);
    return `${AI_PROMPT}\n\n${baseInfo}\n\nAll Odds Data:\n${fullOdds}`;
  };

  const handleAiClick = async (match) => {
    const context = buildAiContext(match);
    setAiModal(true);
    setAiLoading(true);
    setAiError(null);
    setAiResult('');
    try {
      const res = await fetch('http://localhost:4000/ai-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context })
      });
      let data;
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch AI prediction');
      } else {
        data = await res.json();
      }
      setAiResult(data.result || '');
    } catch (err) {
      setAiError(err.message || 'Failed to fetch AI prediction');
    } finally {
      setAiLoading(false);
    }
  };

  const closeAi = () => {
    setAiModal(false);
    setAiResult('');
    setAiError(null);
  };

  const handleRefreshPrediction = async (e, fixtureId) => {
    e.stopPropagation();
    try {
      const res = await fetch(
        `http://localhost:4000/match/${fixtureId}/refresh-prediction`,
        { method: 'POST' }
      );
      let data;
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to refresh prediction');
      } else {
        data = await res.json();
      }
      setMatches((prev) =>
        prev.map((m) =>
          m.fixture?.id === fixtureId ? { ...m, aiPrediction: data.prediction } : m
        )
      );
    } catch (err) {
      console.error(err);
    }
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
      <h1 className="text-center text-2xl font-semibold mb-4">Match List</h1>
      <div className="flex items-center gap-2 mb-4">
        <label htmlFor="league-filter">League:</label>
        <input
          id="league-filter"
          type="text"
          list="league-options"
          value={leagueFilter}
          onChange={(e) => setLeagueFilter(e.target.value)}
          placeholder="Type or select league"
          className="border px-1 py-0.5"
        />
        <datalist id="league-options">
          {leagues.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
        {leagueFilter && (
          <button
            className="text-blue-600 underline"
            onClick={() => setLeagueFilter('')}
          >
            Clear
          </button>
        )}
        <label className="flex items-center gap-1 ml-4">
          <input
            type="checkbox"
            checked={withOddsOnly}
            onChange={(e) => setWithOddsOnly(e.target.checked)}
          />
          Only with odds
        </label>
      </div>
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
        <div className="grid gap-4 md:grid-cols-2">
          {matches
            .filter((m) =>
              leagueFilter
                ? (m.league?.name || '')
                    .toLowerCase()
                    .includes(leagueFilter.toLowerCase())
                : true
            )
            .filter((m) =>
              withOddsOnly
                ? (m.odds?.[0]?.bookmakers?.[0]?.bets?.[0]?.values?.length ?? 0) > 0
                : true
            )
            .map((m) => (
              <div
                key={m.fixture?.id}
                className="border p-2 rounded shadow cursor-pointer relative"
                onClick={() =>
                  setExpandedMatches((prev) => ({
                    ...prev,
                    [m.fixture?.id]: !prev[m.fixture?.id]
                  }))
                }
              >
                <button
                  className="absolute top-2 right-2 p-1 bg-white border rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAiClick(m);
                  }}
                  title="AI Recommendation"
                >
                  <img src="/ai.svg" alt="AI" className="w-4 h-4" />
                </button>
                <h3 className="font-semibold">
                  {m.teams?.home?.name || '-'} vs {m.teams?.away?.name || '-'}
                </h3>
                <p className="text-sm">{m.league?.name || '-'}</p>
                <p className="text-sm">
                  {m.fixture?.date ? new Date(m.fixture.date).toLocaleString() : '-'}
                </p>
                <p className="text-sm mb-1">Odds: {renderOdds(m)}</p>
                {expandedMatches[m.fixture?.id] && (
                  <div>
                    <div className="italic mb-2">
                      <div>
                        AI Prediction:
                        <button
                          className="ml-2 text-blue-600 underline"
                          onClick={(e) => handleRefreshPrediction(e, m.fixture.id)}
                        >
                          Refresh
                        </button>
                      </div>
                      <Markdown text={m.aiPrediction || 'N/A'} />
                    </div>
                    <p className="italic mb-2">
                      Human Prediction: {m.humanPrediction || 'N/A'}
                    </p>
                    {renderAllOdds(m)}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
      {aiModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={closeAi}
        >
          <div
            className="bg-white p-4 rounded max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold mb-2">AI Recommendation</h2>
            {aiLoading && <p>Loading...</p>}
            {aiError && <p className="text-red-600">Error: {aiError}</p>}
            {!aiLoading && !aiError && (
              <textarea
                readOnly
                className="w-full h-64 border p-2"
                value={aiResult}
              />
            )}
            <button
              className="mt-2 px-2 py-1 border rounded"
              onClick={closeAi}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


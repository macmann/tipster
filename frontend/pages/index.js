import { useState, useEffect } from 'react';
import RuleBuilder from '../components/RuleBuilder';
import { getMyanmarBet } from '../utils/myanmarOdds';

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

  return (
    <div className="p-4">
      <nav className="mb-4">
        <a href="/" className="mr-2">Matches</a>
        |
        <a href="/recommendations" className="ml-2">Recommendations</a>
      </nav>
      <h1 className="text-center text-2xl font-semibold mb-4">Match List</h1>
      <RuleBuilder userId="1" />
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
                className="border p-2 rounded shadow cursor-pointer"
                onClick={() =>
                  setExpandedMatches((prev) => ({
                    ...prev,
                    [m.fixture?.id]: !prev[m.fixture?.id]
                  }))
                }
              >
                <h3 className="font-semibold">
                  {m.teams?.home?.name || '-'} vs {m.teams?.away?.name || '-'}
                </h3>
                <p className="text-sm">{m.league?.name || '-'}</p>
                <p className="text-sm">
                  {m.fixture?.date ? new Date(m.fixture.date).toLocaleString() : '-'}
                </p>
                <p className="text-sm mb-1">Odds: {renderOdds(m)}</p>
                {expandedMatches[m.fixture?.id] && renderAllOdds(m)}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}


import { useState, useEffect } from 'react';
import RuleBuilder from '../components/RuleBuilder';

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
  const [withOddsOnly, setWithOddsOnly] = useState(false);

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

  const renderMyanmarBet = (match) => {
    const bet = match.myanmarBet;
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
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th>League</th>
              <th>Home</th>
              <th>Away</th>
              <th>Kickoff</th>
              <th>Odds (1X2)</th>
              <th>Myanmar Bet</th>
              <th>Your Odds</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
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
                <tr key={m.fixture?.id} className="border-b">
                  <td className="p-1 border">{m.league?.name || '-'}</td>
                  <td className="p-1 border">{m.teams?.home?.name || '-'}</td>
                  <td className="p-1 border">{m.teams?.away?.name || '-'}</td>
                  <td className="p-1 border">
                    {m.fixture?.date ? new Date(m.fixture.date).toLocaleString() : '-'}
                  </td>
                  <td className="p-1 border">{renderOdds(m)}</td>
                  <td className="p-1 border">{renderMyanmarBet(m)}</td>
                  <td className="p-1 border">N/A</td>
                  <td className="p-1 border">N/A</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}


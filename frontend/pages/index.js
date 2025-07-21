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

  return (
    <div className="container">
      <nav className="nav">
        <a href="/">Matches</a> | <a href="/recommendations">Recommendations</a>
      </nav>
      <h1>Match List</h1>
      <RuleBuilder userId="1" />
      <div className="filter">
        <label htmlFor="league-filter">League: </label>
        <input
          id="league-filter"
          type="text"
          list="league-options"
          value={leagueFilter}
          onChange={(e) => setLeagueFilter(e.target.value)}
          placeholder="Type or select league"
        />
        <datalist id="league-options">
          {leagues.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
        {leagueFilter && (
          <button className="clear" onClick={() => setLeagueFilter('')}>Clear</button>
        )}
      </div>
      <div className="tabs">
        {Object.entries(TABS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={tab === key ? 'active' : ''}
          >
            {label}
          </button>
        ))}
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="error">Error: {error}</p>}
      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th>League</th>
              <th>Home</th>
              <th>Away</th>
              <th>Kickoff</th>
              <th>Odds (1X2)</th>
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
              .map((m) => (
              <tr key={m.fixture?.id}>
                <td>{m.league?.name || '-'}</td>
                <td>{m.teams?.home?.name || '-'}</td>
                <td>{m.teams?.away?.name || '-'}</td>
                <td>{m.fixture?.date ? new Date(m.fixture.date).toLocaleString() : '-'}</td>
                <td>{renderOdds(m)}</td>
                <td>N/A</td>
                <td>N/A</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <style jsx>{`
        .container {
          padding: 1rem;
        }
        .nav {
          margin-bottom: 1rem;
        }
        h1 {
          text-align: center;
        }
        .tabs {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
        }
        .tabs button {
          margin: 0 0.5rem;
          padding: 0.5rem 1rem;
          border: none;
          background: #f0f0f0;
          cursor: pointer;
        }
        .tabs button.active {
          background: #0070f3;
          color: white;
        }
        .error {
          color: red;
        }
        .filter {
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .filter input {
          padding: 0.25rem;
        }
        .filter .clear {
          background: transparent;
          border: none;
          color: #0070f3;
          cursor: pointer;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 0.5rem;
          text-align: left;
        }
        th {
          background: #f0f0f0;
        }
        @media (max-width: 600px) {
          table, thead, tbody, th, td, tr {
            display: block;
          }
          tr {
            margin-bottom: 1rem;
          }
          th {
            display: none;
          }
          td {
            position: relative;
            padding-left: 50%;
          }
          td::before {
            position: absolute;
            left: 0;
            width: 45%;
            padding-left: 0.5rem;
            font-weight: bold;
            white-space: nowrap;
          }
          td:nth-of-type(1)::before { content: 'League'; }
          td:nth-of-type(2)::before { content: 'Home'; }
          td:nth-of-type(3)::before { content: 'Away'; }
          td:nth-of-type(4)::before { content: 'Kickoff'; }
          td:nth-of-type(5)::before { content: 'Odds'; }
          td:nth-of-type(6)::before { content: 'Your Odds'; }
          td:nth-of-type(7)::before { content: 'Recommendation'; }
        }
      `}</style>
    </div>
  );
}


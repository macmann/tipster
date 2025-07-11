/**
 * Basic Next.js frontend to display betting info.
 *
 * Install dependencies:
 *   cd frontend && npm install
 *
 * Start development server on port 3000:
 *   npm run dev
 */

import { useState, useEffect } from 'react';

const TABS = ['today', 'tomorrow', 'week'];

export default function Home() {
  const [active, setActive] = useState('today');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('2.0');

  useEffect(() => {
    fetchData(active);
  }, [active]);

  async function fetchData(tab) {
    setLoading(true);
    const res = await fetch(`http://localhost:4000/matches-${tab}`);
    const data = await res.json();
    setMatches(data);
    setLoading(false);
  }

  function calc(odd) {
    const num = parseFloat(odd);
    if (isNaN(num)) return '';
    return (num * 0.95).toFixed(2);
  }

  const filtered = matches.filter(m => {
    const home = parseFloat(m.odds['Home']);
    return !filter || isNaN(home) || home < parseFloat(filter);
  });

  return (
    <main style={{ padding: 20 }}>
      <h1>Football Matches</h1>
      <div>
        {TABS.map(t => (
          <button key={t} onClick={() => setActive(t)} disabled={t === active} style={{ marginRight: 5 }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <label>Filter home odds &lt; </label>
        <input value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 60 }} />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table border="1" cellPadding="4" style={{ marginTop: 10 }}>
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
            {filtered.map((m, i) => (
              <tr key={i}>
                <td>{m.league}</td>
                <td>{m.home}</td>
                <td>{m.away}</td>
                <td>{new Date(m.kickoff).toLocaleString()}</td>
                <td>{m.odds['Home']}/{m.odds['Draw']}/{m.odds['Away']}</td>
                <td>{calc(m.odds['Home'])}/{calc(m.odds['Draw'])}/{calc(m.odds['Away'])}</td>
                <td>{parseFloat(calc(m.odds['Home'])) > parseFloat(m.odds['Home']) ? 'Recommended' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

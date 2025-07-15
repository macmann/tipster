import { useEffect, useState } from 'react';

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
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setRecs(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
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
    <div className="container">
      <nav className="nav">
        <a href="/">Matches</a> | <a href="/recommendations">Recommendations</a>
      </nav>
      <h1>Recommendations</h1>
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
              <th>Bet</th>
              <th>Odds</th>
              <th>Rationale</th>
            </tr>
          </thead>
          <tbody>
            {recs.map(r => (
              <tr key={r.fixture?.id}>
                <td>{r.league?.name || '-'}</td>
                <td>{r.teams?.home?.name || '-'}</td>
                <td>{r.teams?.away?.name || '-'}</td>
                <td>{r.fixture?.date ? new Date(r.fixture.date).toLocaleString() : '-'}</td>
                <td>{r.recommendedBet || 'Home Win'}</td>
                <td>{renderOdds(r)}</td>
                <td>{r.rationale || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {accuracy && (
        <div className="accuracy">
          <h2>Recent Accuracy (last 3 days)</h2>
          <p>Wins: {accuracy.win} Losses: {accuracy.loss} ROI: {accuracy.roi}</p>
        </div>
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
        .error {
          color: red;
        }
      `}</style>
    </div>
  );
}

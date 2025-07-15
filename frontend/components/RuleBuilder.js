import { useState, useEffect } from 'react';

export default function RuleBuilder({ userId }) {
  const [minOdds, setMinOdds] = useState('');
  const [maxOdds, setMaxOdds] = useState('');
  const [valueScore, setValueScore] = useState('');
  const [league, setLeague] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchRules() {
      try {
        const res = await fetch(`http://localhost:4000/user/${userId}/rules`);
        if (res.ok) {
          const data = await res.json();
          const r = data.rules || {};
          setMinOdds(r.minOdds || '');
          setMaxOdds(r.maxOdds || '');
          setValueScore(r.valueScore || '');
          setLeague(r.league || '');
        }
      } catch (err) {
        console.error('Failed to load rules', err);
      }
    }
    fetchRules();
  }, [userId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      const body = { minOdds, maxOdds, valueScore, league };
      const res = await fetch(`http://localhost:4000/user/${userId}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setStatus('Saved');
      } else {
        setStatus('Error saving rules');
      }
    } catch (err) {
      console.error('Failed to save rules', err);
      setStatus('Error saving rules');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rule-builder">
      <h2>Rule Builder</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Min Odds: </label>
          <input
            type="number"
            step="0.01"
            value={minOdds}
            onChange={(e) => setMinOdds(e.target.value)}
          />
        </div>
        <div>
          <label>Max Odds: </label>
          <input
            type="number"
            step="0.01"
            value={maxOdds}
            onChange={(e) => setMaxOdds(e.target.value)}
          />
        </div>
        <div>
          <label>Value Score Threshold: </label>
          <input
            type="number"
            step="0.01"
            value={valueScore}
            onChange={(e) => setValueScore(e.target.value)}
          />
        </div>
        <div>
          <label>League: </label>
          <input
            type="text"
            value={league}
            onChange={(e) => setLeague(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Rules'}
        </button>
      </form>
      <h3>Active Rules</h3>
      <ul>
        {minOdds && <li>Min Odds: {minOdds}</li>}
        {maxOdds && <li>Max Odds: {maxOdds}</li>}
        {valueScore && <li>Value Score ≥ {valueScore}</li>}
        {league && <li>League: {league}</li>}
        {!minOdds && !maxOdds && !valueScore && !league && (
          <li>No rules set</li>
        )}
      </ul>
      {status && <p className="status">{status}</p>}
      <style jsx>{`
        .rule-builder {
          margin-bottom: 2rem;
          border: 1px solid #ccc;
          padding: 1rem;
        }
        form div {
          margin-bottom: 0.5rem;
        }
        label {
          margin-right: 0.5rem;
        }
        .status {
          margin-top: 0.5rem;
          color: green;
        }
      `}</style>
    </div>
  );
}

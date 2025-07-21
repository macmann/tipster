import { useState, useEffect } from 'react';

export default function RuleBuilder({ userId }) {
  const [minOdds, setMinOdds] = useState('');
  const [maxOdds, setMaxOdds] = useState('');
  const [valueScore, setValueScore] = useState('');
  const [league, setLeague] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function fetchRules() {
      setLoadError('');
      try {
        const res = await fetch(`http://localhost:4000/user/${userId}/rules`);
        if (res.ok) {
          const data = await res.json();
          const r = data.rules || {};
          setMinOdds(r.minOdds || '');
          setMaxOdds(r.maxOdds || '');
          setValueScore(r.valueScore || '');
          setLeague(r.league || '');
        } else {
          const errData = await res.json().catch(() => ({}));
          setLoadError(errData.error || 'Failed to load rules');
        }
      } catch (err) {
        console.error('Failed to load rules', err);
        setLoadError('Failed to load rules');
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
        const errData = await res.json().catch(() => ({}));
        setStatus(errData.error || 'Error saving rules');
      }
    } catch (err) {
      console.error('Failed to save rules', err);
      setStatus('Error saving rules');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-8 border p-4">
      <h2 className="text-xl font-semibold mb-2">Rule Builder</h2>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label className="mr-2">Min Odds:</label>
          <input
            type="number"
            step="0.01"
            value={minOdds}
            onChange={(e) => setMinOdds(e.target.value)}
            className="border px-1"
          />
        </div>
        <div>
          <label className="mr-2">Max Odds:</label>
          <input
            type="number"
            step="0.01"
            value={maxOdds}
            onChange={(e) => setMaxOdds(e.target.value)}
            className="border px-1"
          />
        </div>
        <div>
          <label className="mr-2">Value Score Threshold:</label>
          <input
            type="number"
            step="0.01"
            value={valueScore}
            onChange={(e) => setValueScore(e.target.value)}
            className="border px-1"
          />
        </div>
        <div>
          <label className="mr-2">League:</label>
          <input
            type="text"
            value={league}
            onChange={(e) => setLeague(e.target.value)}
            className="border px-1"
          />
        </div>
        <button type="submit" disabled={loading} className="px-2 py-1 border">
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
      {loadError && <p className="text-red-600">{loadError}</p>}
      {status && <p className="text-green-600 mt-1">{status}</p>}
    </div>
  );
}

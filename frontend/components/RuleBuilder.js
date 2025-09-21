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
    <div>
      <h2 className="text-xl font-semibold text-neutral-900">Rule Builder</h2>
      <p className="mt-2 text-sm text-neutral-700">
        Configure limits that mirror your bankroll plan. Saved rules inform recommendations on the web
        app and Telegram bot, ensuring we never push markets that fall outside your comfort zone.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col text-sm font-medium text-neutral-800">
          Minimum Odds
          <input
            type="number"
            step="0.01"
            value={minOdds}
            onChange={(e) => setMinOdds(e.target.value)}
            className="mt-1 rounded border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-600 focus:outline-none"
            placeholder="e.g. 1.60"
          />
          <span className="mt-1 text-xs font-normal text-neutral-600">
            Avoid extremely short prices that offer limited upside.
          </span>
        </label>
        <label className="flex flex-col text-sm font-medium text-neutral-800">
          Maximum Odds
          <input
            type="number"
            step="0.01"
            value={maxOdds}
            onChange={(e) => setMaxOdds(e.target.value)}
            className="mt-1 rounded border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-600 focus:outline-none"
            placeholder="e.g. 3.80"
          />
          <span className="mt-1 text-xs font-normal text-neutral-600">
            Cap exposure to long shots that rely on high variance outcomes.
          </span>
        </label>
        <label className="flex flex-col text-sm font-medium text-neutral-800">
          Value Score Threshold
          <input
            type="number"
            step="0.01"
            value={valueScore}
            onChange={(e) => setValueScore(e.target.value)}
            className="mt-1 rounded border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-600 focus:outline-none"
            placeholder="e.g. 1.10"
          />
          <span className="mt-1 text-xs font-normal text-neutral-600">
            Higher scores mean a larger edge between our model and the market price.
          </span>
        </label>
        <label className="flex flex-col text-sm font-medium text-neutral-800">
          Preferred League
          <input
            type="text"
            value={league}
            onChange={(e) => setLeague(e.target.value)}
            className="mt-1 rounded border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-600 focus:outline-none"
            placeholder="Premier League, La Liga..."
          />
          <span className="mt-1 text-xs font-normal text-neutral-600">
            Sticking to familiar competitions improves decision quality.
          </span>
        </label>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded border border-neutral-300 bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-500"
          >
            {loading ? 'Saving…' : 'Save Rules'}
          </button>
        </div>
      </form>
      <section className="mt-6 rounded border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
        <h3 className="text-lg font-semibold text-neutral-900">Active Rules</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {minOdds && <li>Minimum odds: {minOdds}</li>}
          {maxOdds && <li>Maximum odds: {maxOdds}</li>}
          {valueScore && <li>Value score must be at least {valueScore}</li>}
          {league && <li>Preferred league focus: {league}</li>}
          {!minOdds && !maxOdds && !valueScore && !league && (
            <li>No rules configured yet—use the form above to create your first guardrails.</li>
          )}
        </ul>
      </section>
      {loadError && (
        <p className="mt-3 text-sm font-medium text-red-600" role="alert">
          {loadError}
        </p>
      )}
      {status && (
        <p
          className="mt-3 text-sm font-medium text-green-600"
          role="status"
          aria-live="polite"
        >
          {status}
        </p>
      )}
    </div>
  );
}

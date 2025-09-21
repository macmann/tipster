import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Markdown from '../components/Markdown';
import { getMyanmarBet } from '../utils/myanmarOdds';

const QUALITY_PILLARS = [
  {
    title: 'Human-Led Analysis',
    description:
      'Every preview combines quantitative models with editorial judgement so that readers understand the story behind the odds.',
    bullets: [
      'Writers review recent form, injuries, tactical setups, and weather conditions.',
      'Editors cross-check insights with verified league and club sources before publication.'
    ]
  },
  {
    title: 'Transparent Data Sources',
    description:
      'We reference where numbers come from, highlight limitations, and avoid overpromising certainty when markets move quickly.',
    bullets: [
      'Odds are refreshed directly from licensed bookmakers and timestamped on each refresh.',
      'Historical performance metrics are quoted with the sample size so readers can weigh confidence.'
    ]
  },
  {
    title: 'Responsible Betting Guidance',
    description:
      'Our coverage emphasises bankroll discipline and a long-term view. We never promote unrealistic “guaranteed” wins.',
    bullets: [
      'Every page reiterates the risks of gambling and links to independent support organisations.',
      'We include staking tips, variance explanations, and reminders to set personal limits.'
    ]
  }
];

const FAQ_ITEMS = [
  {
    question: 'How are Tipster match recommendations created?',
    answer:
      'Our analysts review bookmaker lines, injury news, and tactical matchups. Machine-learning models surface pricing mismatches, but human reviewers write the final recommendation to ensure context and responsible tone.'
  },
  {
    question: 'What should I do if odds are different from what is listed here?',
    answer:
      'Odds shift constantly. Treat our prices as a snapshot in time and always verify them with a licensed bookmaker in your region before placing a wager.'
  },
  {
    question: 'Does Tipster guarantee profits?',
    answer:
      'No. Betting carries financial risk and should only be done with discretionary funds. We publish educational material and analysis so you can make informed decisions, not to promise outcomes.'
  }
];

const TABS = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  week: 'This Week',
  settings: 'Settings'
};

const COMPETITIONS = {
  England: [
    { id: 39, name: 'Premier League' },
    { id: 40, name: 'Championship' },
    { id: 45, name: 'FA Cup' }
  ],
  Germany: [
    { id: 78, name: 'Bundesliga' },
    { id: 79, name: '2. Bundesliga' },
    { id: 86, name: 'DFB Pokal' }
  ],
  France: [
    { id: 61, name: 'Ligue 1' },
    { id: 62, name: 'Ligue 2' },
    { id: 66, name: 'Coupe de France' }
  ],
  Spain: [
    { id: 140, name: 'La Liga' },
    { id: 141, name: 'Segunda División' },
    { id: 143, name: 'Copa del Rey' }
  ],
  Italy: [
    { id: 135, name: 'Serie A' },
    { id: 136, name: 'Serie B' },
    { id: 137, name: 'Coppa Italia' }
  ],
  Netherlands: [
    { id: 88, name: 'Eredivisie' },
    { id: 89, name: 'Eerste Divisie' },
    { id: 90, name: 'KNVB Beker' }
  ]
};

export default function Home() {
  const [tab, setTab] = useState('today');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [leagueFilter, setLeagueFilter] = useState('');
  const [leagues, setLeagues] = useState([]);
  const [withOddsOnly, setWithOddsOnly] = useState(true);
  const [selectedLeagues, setSelectedLeagues] = useState([]);
  const [expandedMatches, setExpandedMatches] = useState({});
  const [aiModal, setAiModal] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const AI_PROMPT =
    'You are a AI assistant to analyze the football match based on past meeting, scores, current status of team, and the odds and give recommandation and analysis for the user';

  const fetchMatches = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = tab === 'week' ? 'matches-week' : `matches-${tab}`;
      const params = new URLSearchParams();
      if (selectedLeagues.length)
        params.append('leagues', selectedLeagues.join(','));
      if (forceRefresh) params.append('refresh', 'true');
      const paramString = params.toString();
      const url = `http://localhost:4000/${endpoint}${paramString ? `?${paramString}` : ''}`;
      const res = await fetch(url);
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
  };

  useEffect(() => {
    if (tab === 'settings') return;
    fetchMatches();
  }, [tab, selectedLeagues]);

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

  const handleGetPrediction = async (e, fixtureId) => {
    e.stopPropagation();
    try {
      const res = await fetch(
        `http://localhost:4000/match/${fixtureId}/refresh-prediction`,
        { method: 'POST' }
      );
      let data;
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch prediction');
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

  const filteredMatches = matches
    .filter((m) =>
      leagueFilter
        ? (m.league?.name || '').toLowerCase().includes(leagueFilter.toLowerCase())
        : true
    )
    .filter((m) =>
      withOddsOnly
        ? (m.odds?.[0]?.bookmakers?.[0]?.bets?.[0]?.values?.length ?? 0) > 0
        : true
    );

  return (
    <Layout
      title="Football Fixtures, Odds & Expert Betting Insights"
      description="Browse today’s and upcoming football fixtures, compare bookmaker odds, and read Tipster’s editorial match analysis with responsible gambling context."
    >
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Daily Football Intelligence Centre</h1>
        <p className="mt-4 text-lg leading-relaxed text-neutral-700">
          Welcome to Tipster’s match hub where each fixture is paired with transparent odds,
          original editorial notes, and the context you need before placing a bet. We blend
          real-time feeds with human expertise so the page remains valuable even if odds feeds
          are delayed or temporarily unavailable.
        </p>
        <p className="mt-4 text-neutral-700">
          Select a tab to explore fixtures or customise the coverage to your favourite leagues.
          Use the settings panel to subscribe to specific competitions, and reference the
          methodology and responsible betting tips below to understand how we build our advice.
        </p>
      </section>

      <section aria-labelledby="match-centre-heading" className="mt-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="match-centre-heading" className="text-2xl font-semibold">
              Match Centre
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Updated every 15 minutes. Odds are indicative snapshots and may change.
            </p>
          </div>
          {tab !== 'settings' && (
            <button
              className="self-start rounded border border-neutral-300 px-3 py-1 text-sm font-medium hover:bg-neutral-100"
              onClick={() => fetchMatches(true)}
            >
              Refresh Odds &amp; Fixtures
            </button>
          )}
        </div>
        {tab !== 'settings' && (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm md:flex-row md:items-end">
            <div className="flex flex-1 flex-col">
              <label htmlFor="league-filter" className="text-sm font-medium text-neutral-700">
                Filter by league name
              </label>
              <input
                id="league-filter"
                type="text"
                list="league-options"
                value={leagueFilter}
                onChange={(e) => setLeagueFilter(e.target.value)}
                placeholder="Type to search for Premier League, La Liga, Serie A..."
                className="mt-1 rounded border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none"
              />
              <datalist id="league-options">
                {leagues.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
              {leagueFilter && (
                <button
                  className="mt-1 self-start text-xs font-medium text-neutral-600 underline"
                  onClick={() => setLeagueFilter('')}
                >
                  Clear league filter
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={withOddsOnly}
                onChange={(e) => setWithOddsOnly(e.target.checked)}
              />
              Show only fixtures with bookmaker odds
            </label>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Match timeframe">
          {Object.entries(TABS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'
              }`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === 'settings' ? (
          <div className="mt-6 space-y-5 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-700">
              Choose which competitions appear across Tipster. We focus on top divisions to
              keep insights actionable, but you can tailor the feed to your preferences.
            </p>
            {Object.entries(COMPETITIONS).map(([country, comps]) => (
              <div key={country}>
                <h3 className="text-lg font-semibold text-neutral-800">{country}</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {comps.map((comp) => (
                    <label
                      key={comp.id}
                      className="flex items-center gap-2 rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLeagues.includes(comp.id)}
                        onChange={(e) =>
                          setSelectedLeagues((prev) =>
                            e.target.checked
                              ? [...prev, comp.id]
                              : prev.filter((id) => id !== comp.id)
                          )
                        }
                      />
                      {comp.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            {loading && <p className="text-sm text-neutral-600">Loading fixtures…</p>}
            {error && <p className="text-sm font-medium text-red-600">Error: {error}</p>}
            {!loading && !error && (
              filteredMatches.length === 0 ? (
                <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-700">
                  We could not find fixtures that match your filters right now. This page still
                  offers value while feeds refresh—scroll down for methodology insights,
                  bankroll management advice, and editorial previews that remain relevant even
                  without live odds.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredMatches.map((m) => (
                    <article
                      key={m.fixture?.id}
                      className="relative cursor-pointer rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                      onClick={() =>
                        setExpandedMatches((prev) => ({
                          ...prev,
                          [m.fixture?.id]: !prev[m.fixture?.id]
                        }))
                      }
                    >
                      <button
                        type="button"
                        className="absolute right-3 top-3 rounded border border-neutral-300 bg-white p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAiClick(m);
                        }}
                        title="Open AI recommendation"
                      >
                        <img src="/ai.svg" alt="AI" className="h-4 w-4" />
                      </button>
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {m.teams?.home?.name || '-'} vs {m.teams?.away?.name || '-'}
                      </h3>
                      <p className="text-sm text-neutral-600">{m.league?.name || '-'}</p>
                      <p className="mt-1 text-sm text-neutral-600">
                        {m.fixture?.date
                          ? new Date(m.fixture.date).toLocaleString()
                          : 'Kick-off time TBD'}
                      </p>
                      <p className="mt-2 text-sm font-medium text-neutral-800">
                        Headline Odds: {renderOdds(m)}
                      </p>
                      {m.aiPrediction ? (
                        <div
                          className="mt-2 rounded border border-neutral-200 bg-neutral-50 p-2 text-sm italic text-neutral-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold not-italic text-neutral-800">
                              AI Prediction
                            </span>
                            <button
                              type="button"
                              className="text-xs font-medium text-blue-700 underline"
                              onClick={(e) => handleGetPrediction(e, m.fixture.id)}
                            >
                              Refresh insight
                            </button>
                          </div>
                          <Markdown text={m.aiPrediction} />
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="mt-2 text-sm font-medium text-blue-700 underline"
                          onClick={(e) => handleGetPrediction(e, m.fixture.id)}
                        >
                          Generate AI breakdown
                        </button>
                      )}
                      {expandedMatches[m.fixture?.id] && (
                        <div className="mt-3 space-y-3 text-sm text-neutral-700">
                          <p className="italic">
                            Human Analyst View: {m.humanPrediction || 'Awaiting review'}
                          </p>
                          {renderAllOdds(m)}
                          <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
                            <h4 className="font-semibold text-neutral-800">
                              Myanmar Line Conversion
                            </h4>
                            <p className="mt-1 text-neutral-700">{renderMyanmarBet(m)}</p>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        {QUALITY_PILLARS.map((pillar) => (
          <article key={pillar.title} className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-neutral-900">{pillar.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              {pillar.description}
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700">
              {pillar.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="mt-12 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-neutral-900">How Tipster Builds Its Odds Analysis</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-6 text-sm leading-relaxed text-neutral-700">
          <li>
            <strong>Collect data:</strong> Match odds, injury reports, and recent xG metrics are
            aggregated every morning from licensed bookmakers and statistical feeds.
          </li>
          <li>
            <strong>Model projections:</strong> We run Poisson-based scoring models and adjust
            outputs with form guides and travel considerations.
          </li>
          <li>
            <strong>Editorial review:</strong> A human analyst verifies that the model output
            aligns with tactical realities and writes the final preview in plain language.
          </li>
          <li>
            <strong>Responsible framing:</strong> Each recommendation references stake sizing and
            includes reminders about risk and bankroll limits.
          </li>
        </ol>
        <aside className="mt-6 rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Tipster is an informational resource. We do not accept payments for favourable tips
          and we reject any ads that attempt to bypass our editorial standards. If you spot a
          discrepancy in odds or content, please contact us so we can correct the record within
          one business day.
        </aside>
      </section>

      <section className="mt-12 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-neutral-900">Frequently Asked Questions</h2>
        <div className="mt-4 space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group rounded border border-neutral-200 bg-neutral-50 p-4"
            >
              <summary className="cursor-pointer text-sm font-semibold text-neutral-900 group-open:text-neutral-700">
                {item.question}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {aiModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
          onClick={closeAi}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-neutral-900">AI Recommendation</h2>
              <button
                type="button"
                className="text-sm font-medium text-blue-700 underline"
                onClick={closeAi}
              >
                Close
              </button>
            </div>
            <div className="px-4 py-3">
              {aiLoading && <p className="text-sm text-neutral-600">Generating insight…</p>}
              {aiError && (
                <p className="text-sm font-medium text-red-600">Error: {aiError}</p>
              )}
              {!aiLoading && !aiError && (
                <textarea
                  readOnly
                  className="h-72 w-full rounded border border-neutral-300 p-3 text-sm leading-relaxed"
                  value={aiResult}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}


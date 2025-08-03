import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function MatchDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    async function fetchMatch() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:4000/match/${id}`);
        let data;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch match');
        } else {
          data = await res.json();
        }
        setMatch(data);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchMatch();
  }, [id]);

  const renderBets = () => {
    const bookmakers = match?.odds?.[0]?.bookmakers || [];
    if (bookmakers.length === 0) return <p>No odds available.</p>;
    return (
      <div className="space-y-4">
        {bookmakers.map((bm) => (
          <div key={bm.id || bm.name} className="border p-2 rounded">
            <h3 className="font-semibold mb-2">{bm.name}</h3>
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

  return (
    <div className="p-4">
      <nav className="mb-4">
        <a href="/" className="mr-2">Matches</a>
        |
        <a href="/recommendations" className="ml-2">Recommendations</a>
      </nav>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {match && (
        <div>
          <h1 className="text-2xl font-semibold mb-2">
            {match.teams?.home?.name} vs {match.teams?.away?.name}
          </h1>
          <p className="mb-4">{new Date(match.fixture?.date).toLocaleString()}</p>
          {renderBets()}
        </div>
      )}
    </div>
  );
}

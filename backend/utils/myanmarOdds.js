const HANDICAP_TO_TYPE = {
  '-1.5': '1-30%',
  '-1.0': '1-50%',
  '-0.5': '0.5-50%',
  '0': 'Level Ball',
  '-2.0': '2-50%',
  '-2.5': '2-30%'
};

const MYANMAR_RULES = {
  '1-30%': 'Win by 1 goal → 30% payout, win by 2+ goals → 100% payout, else lose.',
  '1-50%': 'Win by 1 goal → 50% payout, win by 2+ goals → 100% payout, else lose.',
  '0.5-50%': 'Win by any → 100%, draw → 50% refund, lose → lose.',
  'Level Ball': 'Win → 100%, draw → refund, lose → lose.',
  '2-50%': 'Win by 2 goals → 50% payout, win by 3+ goals → 100% payout, else lose.',
  '2-30%': 'Win by 2 goals → 30% payout, win by 3+ goals → 100% payout, else lose.'
};

function mapHandicapToMyanmar(handicap, commission = 1.0) {
  const type = HANDICAP_TO_TYPE[String(handicap)] || 'Unknown';
  const rule = MYANMAR_RULES[type] || 'No Myanmar rule for this handicap.';
  return { type, rule, payoutRate: Math.round(commission * 100) / 100 };
}

function parseHandicap(str) {
  if (str === undefined || str === null) return NaN;
  if (typeof str === 'number') return parseFloat(str);
  const match = String(str).match(/-?\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : NaN;
}

function extractHandicapFromOdds(odds) {
  const bookmakers = odds?.[0]?.bookmakers || [];
  for (const bookmaker of bookmakers) {
    const bet = (bookmaker.bets || []).find((b) =>
      (b.name || '').toLowerCase().includes('asian handicap')
    );
    if (bet && Array.isArray(bet.values)) {
      for (const val of bet.values) {
        const h = parseHandicap(val.handicap ?? val.value ?? val.name);
        if (!Number.isNaN(h)) return h;
      }
    }
  }
  return null;
}

function getMyanmarBet(odds, commission = 1.0) {
  const handicap = extractHandicapFromOdds(odds);
  if (handicap === null) return null;
  const mapped = mapHandicapToMyanmar(handicap, commission);
  return { handicap, ...mapped };
}

module.exports = {
  getMyanmarBet
};

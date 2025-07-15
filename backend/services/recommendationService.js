const UserRule = require('../models/UserRule');
const { getMatches, getOdds } = require('./apiFootballService');

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function enrichMatchesWithOdds(matches) {
  return Promise.all(
    matches.map(async (m) => {
      try {
        const odds = await getOdds(m.fixture.id);
        return { ...m, odds: odds.response };
      } catch (err) {
        return { ...m, odds: [] };
      }
    })
  );
}

function calculateValueScore(oddNum, rules) {
  if (!oddNum) return 0;
  const minOdds = rules.minOdds ? parseFloat(rules.minOdds) : 0;
  return oddNum - minOdds;
}

async function recommendForUser(userId, date = new Date()) {
  const userRule = await UserRule.findOne({ userId });
  if (!userRule) return [];
  const rules = userRule.rules || {};

  const data = await getMatches(formatDate(date));
  const matches = await enrichMatchesWithOdds(data.response);

  const recommendations = [];
  for (const match of matches) {
    const oddStr = match.odds?.[0]?.bookmakers?.[0]?.bets?.[0]?.values?.[0]?.odd;
    const oddNum = parseFloat(oddStr);
    if (rules.minOdds && (!oddNum || oddNum < parseFloat(rules.minOdds))) {
      continue;
    }
    const valueScore = calculateValueScore(oddNum, rules);
    const rationale = [];
    if (rules.minOdds) {
      rationale.push(`Odds ${oddNum} >= minOdds ${rules.minOdds}`);
    } else {
      rationale.push('No minOdds rule');
    }
    recommendations.push({ ...match, valueScore, rationale: rationale.join('; ') });
  }

  recommendations.sort((a, b) => b.valueScore - a.valueScore);
  return recommendations;
}

module.exports = {
  recommendForUser,
};

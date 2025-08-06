const OpenAI = require('openai');
const MatchPrediction = require('../models/MatchPrediction');
const openaiKey = process.env.OPENAI_API_KEY;
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

function summarizeOdds(match) {
  const values =
    match?.odds?.[0]?.bookmakers?.[0]?.bets?.[0]?.values || [];
  return values
    .map((v) => `${v.value || v.name}: ${v.odd}`)
    .join(', ');
}

async function generatePrediction(match) {
  if (!openai) return '';
  const home = match.teams?.home?.name || 'Home';
  const away = match.teams?.away?.name || 'Away';
  const odds = summarizeOdds(match) || 'odds unavailable';

  const prompt =
    `Use web search to gather any up-to-date information about the football match ` +
    `${home} vs ${away}. Given the betting odds: ${odds}, ` +
    `provide a concise prediction for the match outcome.`;

  try {
    const resp = await openai.responses.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
      tools: [{ type: 'web_search' }],
    });
    return resp.output?.[0]?.content?.[0]?.text?.trim() || '';
  } catch (err) {
    console.error('Prediction generation failed:', err);
    return '';
  }
}

async function getOrCreatePrediction(match) {
  const fixtureId = match?.fixture?.id;
  if (!fixtureId) return { aiPrediction: '', humanPrediction: '' };
  let doc = await MatchPrediction.findOne({ fixtureId });
  if (!doc) {
    const prediction = await generatePrediction(match);
    doc = await MatchPrediction.create({ fixtureId, prediction });
  }
  return {
    aiPrediction: doc.prediction || '',
    humanPrediction: doc.human || '',
  };
}

async function getPrediction(fixtureId) {
  const doc = await MatchPrediction.findOne({ fixtureId });
  return {
    aiPrediction: doc?.prediction || '',
    humanPrediction: doc?.human || '',
  };
}

async function setHumanPrediction(fixtureId, humanPrediction) {
  if (!fixtureId) return '';
  const doc = await MatchPrediction.findOneAndUpdate(
    { fixtureId },
    { human: humanPrediction },
    { new: true, upsert: true }
  );
  return doc.human || '';
}

async function refreshPrediction(match) {
  const fixtureId = match?.fixture?.id;
  if (!fixtureId) return '';
  const prediction = await generatePrediction(match);
  if (!prediction) return '';
  await MatchPrediction.findOneAndUpdate(
    { fixtureId },
    { prediction, createdAt: new Date() },
    { upsert: true }
  );
  return prediction;
}

module.exports = {
  getOrCreatePrediction,
  getPrediction,
  refreshPrediction,
  setHumanPrediction,
};

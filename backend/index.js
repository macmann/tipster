require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const {
  getMatches,
  getOdds,
  getResults,
  getFixture
} = require('./services/apiFootballService');
const { recommendForUser } = require('./services/recommendationService');
const { getMyanmarBet } = require('./utils/myanmarOdds');
const {
  getPrediction,
  refreshPrediction,
  setHumanPrediction
} = require('./services/predictionService');
const UserRule = require('./models/UserRule');
const OpenAI = require('openai');

// Instantiate OpenAI only if an API key is provided so the server can start
// even when AI features are not configured.
const openaiKey = process.env.OPENAI_API_KEY;
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

const app = express();

const TOP_LEAGUE_IDS = [39, 40, 140, 141, 135, 136, 78, 79, 61, 62, 88, 89];
const EURO_CUP_KEYWORDS = [
  'UEFA Champions League',
  'UEFA Europa League',
  'UEFA Europa Conference League',
  'UEFA Super Cup'
];
const MATCH_REQUEST_DELAY_MS = Number(process.env.MATCH_REQUEST_DELAY_MS) || 1000;

// Enable CORS for the frontend running on localhost:3000
app.use(cors({ origin: 'http://localhost:3000' }));

// Parse JSON request bodies with a higher size limit to handle large payloads
app.use(express.json({ limit: '1mb' }));

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Simple test route
app.get('/', (req, res) => {
  res.send('API running');
});

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function isTopSixLeague(league) {
  return TOP_LEAGUE_IDS.includes(league?.id);
}

function isEuroCup(league) {
  return EURO_CUP_KEYWORDS.some((keyword) => league?.name?.includes(keyword));
}

function filterLeagues(matches, topSix = false, euroCups = false) {
  if (!topSix && !euroCups) return matches;
  return matches.filter(
    (m) => (topSix && isTopSixLeague(m.league)) || (euroCups && isEuroCup(m.league))
  );
}

async function enrichMatchesWithOdds(matches) {
  const enriched = [];
  for (const m of matches) {
    try {
      const odds = await getOdds(m.fixture.id);
      const myanmarBet = getMyanmarBet(odds.response);
      const { aiPrediction, humanPrediction } = await getPrediction(m.fixture.id);
      enriched.push({
        ...m,
        odds: odds.response,
        myanmarBet,
        aiPrediction,
        humanPrediction,
      });
    } catch (err) {
      const { aiPrediction, humanPrediction } = await getPrediction(m.fixture.id);
      enriched.push({
        ...m,
        odds: [],
        myanmarBet: null,
        aiPrediction,
        humanPrediction,
      });
    }
    if (MATCH_REQUEST_DELAY_MS > 0) {
      await new Promise((r) => setTimeout(r, MATCH_REQUEST_DELAY_MS));
    }
  }
  return enriched;
}

app.get('/matches-today', async (req, res, next) => {
  const today = formatDate(new Date());
  const topSix = req.query.top6 === 'true';
  const euroCups = req.query.euro === 'true';
  try {
    const data = await getMatches(today);
    const filtered = filterLeagues(data.response, topSix, euroCups);
    const enriched = await enrichMatchesWithOdds(filtered);
    res.json(enriched);
  } catch (err) {
    console.error(err);
    err.message = "Unable to fetch today's matches. Please try again later.";
    next(err);
  }
});

app.get('/matches-tomorrow', async (req, res, next) => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const date = formatDate(d);
  const topSix = req.query.top6 === 'true';
  const euroCups = req.query.euro === 'true';
  try {
    const data = await getMatches(date);
    const filtered = filterLeagues(data.response, topSix, euroCups);
    const enriched = await enrichMatchesWithOdds(filtered);
    res.json(enriched);
  } catch (err) {
    console.error(err);
    err.message = "Unable to fetch tomorrow's matches. Please try again later.";
    next(err);
  }
});

app.get('/matches-week', async (req, res, next) => {
  const today = new Date();
  const all = [];
  const topSix = req.query.top6 === 'true';
  const euroCups = req.query.euro === 'true';
  try {
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const data = await getMatches(formatDate(d));
      const filtered = filterLeagues(data.response, topSix, euroCups);
      const enriched = await enrichMatchesWithOdds(filtered);
      all.push(...enriched);
    }
    res.json(all);
  } catch (err) {
    console.error(err);
    err.message = "Unable to fetch this week's matches. Please try again later.";
    next(err);
  }
});

app.get('/match/:id', async (req, res, next) => {
  const matchId = req.params.id;
  try {
    const fixtureData = await getFixture(matchId);
    const fixture = fixtureData.response?.[0];
    if (!fixture) return res.status(404).json({ error: 'Match not found' });
    const oddsData = await getOdds(matchId);
    fixture.odds = oddsData.response;
    const { aiPrediction, humanPrediction } = await getPrediction(matchId);
    fixture.aiPrediction = aiPrediction;
    fixture.humanPrediction = humanPrediction;
    res.json(fixture);
  } catch (err) {
    console.error(err);
    err.message = 'Failed to fetch match details. Please try again later.';
    next(err);
  }
});

app.post('/match/:id/refresh-prediction', async (req, res, next) => {
  const matchId = req.params.id;
  try {
    const fixtureData = await getFixture(matchId);
    const fixture = fixtureData.response?.[0];
    if (!fixture) return res.status(404).json({ error: 'Match not found' });
    const oddsData = await getOdds(matchId);
    const prediction = await refreshPrediction({
      ...fixture,
      odds: oddsData.response,
    });
    res.json({ prediction });
  } catch (err) {
    console.error(err);
    err.message = 'Failed to refresh prediction. Please try again later.';
    next(err);
  }
});

app.post('/match/:id/human-prediction', async (req, res, next) => {
  const matchId = req.params.id;
  const prediction = req.body?.prediction;
  if (!prediction) {
    return res.status(400).json({ error: 'prediction is required' });
  }
  try {
    const humanPrediction = await setHumanPrediction(matchId, prediction);
    res.json({ humanPrediction });
  } catch (err) {
    console.error(err);
    err.message = 'Failed to save human prediction. Please try again later.';
    next(err);
  }
});

app.get('/recommend', async (req, res, next) => {
  const userId = req.query.userId;
  const dateStr = req.query.date;
  if (!userId) return res.status(400).json({ error: 'userId query required' });
  const date = dateStr ? new Date(dateStr) : new Date();
  try {
    const recommendations = await recommendForUser(userId, date);
    res.json(recommendations);
  } catch (err) {
    console.error(err);
    err.message = 'Failed to generate recommendations. Please try again later.';
    next(err);
  }
});

app.post('/user/:id/rules', async (req, res, next) => {
  const userId = req.params.id;
  try {
    const doc = await UserRule.findOneAndUpdate(
      { userId },
      { rules: req.body },
      { new: true, upsert: true }
    );
    res.json(doc);
  } catch (err) {
    console.error(err);
    err.message = 'Failed to save rules. Please try again later.';
    next(err);
  }
});

app.get('/user/:id/rules', async (req, res, next) => {
  const userId = req.params.id;
  try {
    const doc = await UserRule.findOne({ userId });
    if (!doc) return res.status(404).json({});
    res.json(doc);
  } catch (err) {
    console.error(err);
    err.message = 'Failed to fetch rules. Please try again later.';
    next(err);
  }
});

  app.get('/results', async (req, res, next) => {
    const date = req.query.date || formatDate(new Date());
    try {
      const data = await getResults(date);
      res.json(data);
    } catch (err) {
      console.error(err);
      err.message = 'Failed to fetch results. Please try again later.';
      next(err);
    }
  });

  app.post('/ai-predict', async (req, res, next) => {
    const context = req.body?.context;
    if (!context) {
      return res.status(400).json({ error: 'context is required' });
    }
    if (!openai) {
      return res.status(503).json({ error: 'AI service unavailable' });
    }
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: context }]
      });
      const result = completion.choices?.[0]?.message?.content?.trim() || '';
      res.json({ result });
    } catch (err) {
      console.error(err);
      err.message = 'Failed to fetch AI prediction. Please try again later.';
      next(err);
    }
  });

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));


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
  getOrCreatePrediction,
  getPrediction,
  refreshPrediction
} = require('./services/predictionService');
const UserRule = require('./models/UserRule');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();

// Enable CORS for the frontend running on localhost:3000
app.use(cors({ origin: 'http://localhost:3000' }));

// Parse JSON request bodies
app.use(express.json());

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

async function enrichMatchesWithOdds(matches) {
  return Promise.all(
    matches.map(async (m) => {
      try {
        const odds = await getOdds(m.fixture.id);
        const myanmarBet = getMyanmarBet(odds.response);
        const aiPrediction = await getOrCreatePrediction({
          ...m,
          odds: odds.response,
        });
        return { ...m, odds: odds.response, myanmarBet, aiPrediction };
      } catch (err) {
        const aiPrediction = await getPrediction(m.fixture.id);
        return { ...m, odds: [], myanmarBet: null, aiPrediction };
      }
    })
  );
}

app.get('/matches-today', async (req, res, next) => {
  const today = formatDate(new Date());
  try {
    const data = await getMatches(today);
    const enriched = await enrichMatchesWithOdds(data.response);
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
  try {
    const data = await getMatches(date);
    const enriched = await enrichMatchesWithOdds(data.response);
    res.json(enriched);
  } catch (err) {
    console.error(err);
    err.message = 'Unable to fetch tomorrow\'s matches. Please try again later.';
    next(err);
  }
});

app.get('/matches-week', async (req, res, next) => {
  const today = new Date();
  const all = [];
  try {
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const data = await getMatches(formatDate(d));
      const enriched = await enrichMatchesWithOdds(data.response);
      all.push(...enriched);
    }
    res.json(all);
  } catch (err) {
    console.error(err);
    err.message = 'Unable to fetch this week\'s matches. Please try again later.';
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
    fixture.aiPrediction = await getOrCreatePrediction({
      ...fixture,
      odds: oddsData.response,
    });
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


require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const {
  getMatches,
  getOdds,
  getResults
} = require('./services/apiFootballService');
const { recommendForUser } = require('./services/recommendationService');
const UserRule = require('./models/UserRule');

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
        return { ...m, odds: odds.response };
      } catch (err) {
        return { ...m, odds: [] };
      }
    })
  );
}

app.get('/matches-today', async (req, res) => {
  const today = formatDate(new Date());
  try {
    const data = await getMatches(today);
    const enriched = await enrichMatchesWithOdds(data.response);
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

app.get('/matches-tomorrow', async (req, res) => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const date = formatDate(d);
  try {
    const data = await getMatches(date);
    const enriched = await enrichMatchesWithOdds(data.response);
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

app.get('/matches-week', async (req, res) => {
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
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

app.get('/recommend', async (req, res) => {
  const userId = req.query.userId;
  const dateStr = req.query.date;
  if (!userId) return res.status(400).json({ error: 'userId query required' });
  const date = dateStr ? new Date(dateStr) : new Date();
  try {
    const recommendations = await recommendForUser(userId, date);
    res.json(recommendations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

app.post('/user/:id/rules', async (req, res) => {
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
    res.status(500).json({ error: 'Failed to save rules' });
  }
});

app.get('/user/:id/rules', async (req, res) => {
  const userId = req.params.id;
  try {
    const doc = await UserRule.findOne({ userId });
    if (!doc) return res.status(404).json({});
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

app.get('/results', async (req, res) => {
  const date = req.query.date || formatDate(new Date());
  try {
    const data = await getResults(date);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));


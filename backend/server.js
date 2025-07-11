/**
 * Simple Express backend for fetching football match odds.
 *
 * Install dependencies:
 *   cd backend && npm install
 *
 * Start the server on port 4000 (for local development):
 *   npm start
 *
 * Alternatively, the same functionality is available via Next.js API routes
 * in `frontend/pages/api`. Deploy only the frontend service if you cannot run
 * two servers.
 *
 * Requires .env file with API_FOOTBALL_KEY=<your api key>
 */

import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

const API_KEY = process.env.API_FOOTBALL_KEY;
const API_URL = 'https://v3.football.api-sports.io';

const LEAGUES = [39, 140, 135, 78, 61]; // EPL, La Liga, Serie A, Bundesliga, Ligue 1

const http = axios.create({
  baseURL: API_URL,
  headers: { 'x-apisports-key': API_KEY }
});

async function fetchMatches(from, to) {
  const all = [];
  for (const league of LEAGUES) {
    const params = { league, from, to, timezone: 'UTC' };
    const res = await http.get('/fixtures', { params });
    for (const item of res.data.response) {
      const match = {
        league: item.league.name,
        home: item.teams.home.name,
        away: item.teams.away.name,
        kickoff: item.fixture.date,
        odds: {}
      };
      // fetch odds for fixture
      try {
        const oddsRes = await http.get('/odds', {
          params: { fixture: item.fixture.id, bookmaker: 6 } // bookmaker 6: bet365
        });
        const bet = oddsRes.data.response[0]?.bookmakers[0]?.bets.find(b => b.name === 'Match Winner');
        if (bet) {
          for (const v of bet.values) {
            match.odds[v.value] = v.odd;
          }
        }
      } catch (e) {
        // ignore odds errors
      }
      all.push(match);
    }
  }
  return all;
}

function todayStr(offset = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

app.get('/matches-today', async (req, res) => {
  try {
    const data = await fetchMatches(todayStr(), todayStr());
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

app.get('/matches-tomorrow', async (req, res) => {
  try {
    const date = todayStr(1);
    const data = await fetchMatches(date, date);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

app.get('/matches-week', async (req, res) => {
  try {
    const start = todayStr();
    const end = todayStr(7);
    const data = await fetchMatches(start, end);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});


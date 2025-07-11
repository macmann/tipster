import axios from 'axios';

// Requires API_FOOTBALL_KEY in your environment (.env.local when using Next.js)

const API_KEY = process.env.API_FOOTBALL_KEY;
const API_URL = 'https://v3.football.api-sports.io';
const LEAGUES = [39, 140, 135, 78, 61]; // EPL, La Liga, Serie A, Bundesliga, Ligue 1

const http = axios.create({
  baseURL: API_URL,
  headers: { 'x-apisports-key': API_KEY }
});

export async function fetchMatches(from, to) {
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
      try {
        const oddsRes = await http.get('/odds', {
          params: { fixture: item.fixture.id, bookmaker: 6 }
        });
        const bet = oddsRes.data.response[0]?.bookmakers[0]?.bets.find(b => b.name === 'Match Winner');
        if (bet) {
          for (const v of bet.values) {
            match.odds[v.value] = v.odd;
          }
        }
      } catch (e) {
        // ignore odds fetch errors
      }
      all.push(match);
    }
  }
  return all;
}

export function todayStr(offset = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

const axios = require('axios');
const NodeCache = require('node-cache');
require('dotenv').config();

const API_BASE_URL = 'https://api.the-odds-api.com/v4';
const API_KEY = process.env.THE_ODDS_API_KEY;
const SPORT = process.env.THE_ODDS_API_SPORT || 'soccer_epl';
const REGION = process.env.THE_ODDS_API_REGION || 'uk';
const MARKETS = process.env.THE_ODDS_API_MARKETS || 'h2h';

const cache = new NodeCache({ stdTTL: 600 });

async function fetchWithCache(key, fetcher) {
  const cached = cache.get(key);
  if (cached) return cached;
  const data = await fetcher();
  cache.set(key, data);
  return data;
}

function mapEvent(event) {
  return {
    fixture: {
      id: event.id,
      date: event.commence_time,
    },
    league: {
      id: event.sport_key,
      name: event.sport_title,
    },
    teams: {
      home: { name: event.home_team },
      away: { name: event.away_team },
    },
    odds: [
      {
        bookmakers: (event.bookmakers || []).map((bm) => ({
          name: bm.title,
          bets: (bm.markets || []).map((m) => ({
            name: m.key,
            values: (m.outcomes || []).map((o) => ({
              name: o.name,
              odd: o.price,
              handicap: o.point,
            })),
          })),
        })),
      },
    ],
  };
}

async function fetchEvents() {
  try {
    const response = await axios.get(`${API_BASE_URL}/sports/${SPORT}/odds`, {
      params: {
        apiKey: API_KEY,
        regions: REGION,
        markets: MARKETS,
        dateFormat: 'iso',
        oddsFormat: 'decimal',
      },
    });
    const events = response.data || [];
    if (events.length === 0) {
      console.warn('The Odds API returned no events for the current request.');
    }
    return events;
  } catch (err) {
    if (err.response) {
      console.error(
        `The Odds API error (${err.response.status}):`,
        err.response.data
      );
    } else {
      console.error('The Odds API request failed:', err.message);
    }
    throw err;
  }
}

async function getMatches(date) {
  return fetchWithCache(`matches_${date}`, async () => {
    const events = await fetchEvents();
    const filtered = events.filter((e) =>
      e.commence_time.startsWith(date)
    );
    if (filtered.length === 0) {
      console.warn(`No matches found for date ${date} from The Odds API.`);
    }
    return { response: filtered.map(mapEvent) };
  });
}

async function getOdds(matchId) {
  return fetchWithCache(`odds_${matchId}`, async () => {
    const events = await fetchEvents();
    const event = events.find((e) => e.id == matchId);
    if (!event) return { response: [] };
    return { response: [mapEvent(event).odds[0]] };
  });
}

async function getResults(date) {
  // The Odds API does not provide historical results.
  return { response: [] };
}

async function getFixture(matchId) {
  return fetchWithCache(`fixture_${matchId}`, async () => {
    const events = await fetchEvents();
    const event = events.find((e) => e.id == matchId);
    if (!event) return { response: [] };
    return { response: [mapEvent(event)] };
  });
}

module.exports = {
  getMatches,
  getOdds,
  getResults,
  getFixture,
};

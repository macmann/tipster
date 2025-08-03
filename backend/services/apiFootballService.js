const axios = require('axios');
const NodeCache = require('node-cache');
require('dotenv').config();

const API_BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY;

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes TTL

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'x-apisports-key': API_KEY }
});

async function fetchWithCache(key, fetcher) {
  const cached = cache.get(key);
  if (cached) return cached;
  const data = await fetcher();
  cache.set(key, data);
  return data;
}

async function getMatches(date) {
  return fetchWithCache(`matches_${date}`, async () => {
    const response = await http.get('/fixtures', { params: { date } });
    return response.data;
  });
}

async function getOdds(matchId) {
  return fetchWithCache(`odds_${matchId}`, async () => {
    const response = await http.get('/odds', { params: { fixture: matchId } });
    return response.data;
  });
}

async function getResults(date) {
  return fetchWithCache(`results_${date}`, async () => {
    const response = await http.get('/fixtures', { params: { date, status: 'FT' } });
    return response.data;
  });
}

async function getFixture(matchId) {
  return fetchWithCache(`fixture_${matchId}`, async () => {
    const response = await http.get('/fixtures', { params: { id: matchId } });
    return response.data;
  });
}

module.exports = {
  getMatches,
  getOdds,
  getResults,
  getFixture
};

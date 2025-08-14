require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const axios = require('axios');
const OpenAI = require('openai');

const User = require('./models/User');

// Allow BOT_TOKEN or TELEGRAM_BOT_TOKEN to be supplied. dotenv does not
// expand variables, so BOT_TOKEN may accidentally be set to the literal
// string "$TELEGRAM_BOT_TOKEN" if the user mirrors the .env.example file.
// Treat such placeholders as missing configuration.
const token =
  process.env.BOT_TOKEN && !process.env.BOT_TOKEN.startsWith('$')
    ? process.env.BOT_TOKEN
    : process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('BOT_TOKEN not specified in .env');
}

// Base URL for the backend API that provides match data. This is configurable
// so the bot can connect to a remote server instead of assuming localhost.
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

const openaiKey = process.env.OPENAI_API_KEY;
const openai = openaiKey
  ? new OpenAI({ apiKey: openaiKey })
  : null;

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = String(msg.from.id);
  try {
    const existing = await User.findOne({ telegramId });
    if (!existing) {
      await User.create({
        telegramId,
        username: msg.from.username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
      });
    }
    bot.sendMessage(chatId, 'Welcome to the Tipster bot!');
  } catch (err) {
    console.error('Error registering user:', err);
    bot.sendMessage(chatId, 'Failed to register user.');
  }
});

function formatOdds(match) {
  const values =
    match.odds?.[0]?.bookmakers?.[0]?.bets?.[0]?.values || [];
  if (!values.length) return 'no odds available';
  return values.map((v) => `${v.value || v.name} at ${v.odd}`).join(', ');
}

function formatPrediction(match) {
  const ai = match.aiPrediction;
  const human = match.humanPrediction;
  if (ai && human) return `Our AI leans ${ai} and a human suggests ${human}`;
  if (ai) return `Our AI leans ${ai}`;
  if (human) return `A human suggests ${human}`;
  return 'No prediction yet';
}

function describeMatch(match) {
  const kickoff = match.fixture?.date
    ? new Date(match.fixture.date).toLocaleString()
    : 'soon';
  const odds = formatOdds(match);
  const prediction = formatPrediction(match);
  return `${match.teams.home.name} meet ${match.teams.away.name} on ${kickoff}. Odds suggest ${odds}. ${prediction}.`;
}

// Lightweight intent extraction with OpenAI for date/teams
async function extractIntent(text) {
  if (!openai) throw new Error('OpenAI API key not configured');
  const systemPrompt =
    'Extract the intended date (today, tomorrow or YYYY-MM-DD) and optional team names from the user question. ' +
    'Ignore generic sports terms like "match", "matches", "game", "games", ' +
    '"prediction", "predictions", "odds", "bet", "bets", "tip", and "tips". ' +
    'Respond ONLY with JSON in the form {"date": "today|tomorrow|YYYY-MM-DD", "teams": ["Team A", "Team B"]}.';
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ],
  });
  let content = resp.choices[0]?.message?.content?.trim() || '';
  // Remove code block if present
  if (content.startsWith('```json')) {
    content = content.replace(/```json|```/g, '').trim();
  } else if (content.startsWith('```')) {
    content = content.replace(/```/g, '').trim();
  }
  // Only parse first JSON object
  const jsonMatch = content.match(/{[\s\S]+}/);
  if (!jsonMatch) return null;
  let intent;
  try {
    intent = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Intent JSON parse error:', err);
    return null;
  }
  const genericWords = [
    'match',
    'matches',
    'game',
    'games',
    'for',
    'prediction',
    'predictions',
    'tip',
    'tips',
    'odds',
    'bet',
    'bets',
  ];
  if (intent.teams && Array.isArray(intent.teams)) {
    intent.teams = intent.teams.filter(
      (t) => !genericWords.includes(t.toLowerCase())
    );
  }
  return intent;
}

// Main natural language handler that returns stored predictions
bot.on('message', async (msg) => {
  const text = msg.text;
  if (!text || text.startsWith('/')) return;

  const chatId = msg.chat.id;
  const lower = text.toLowerCase().trim();
  const greetings = ['hi', 'hay', 'hey', 'hello'];

  if (greetings.includes(lower)) {
    try {
      const res = await axios.get(`${API_BASE_URL}/matches-today`);
      const lines = (res.data || []).slice(0, 5).map(describeMatch);
      bot.sendMessage(
        chatId,
        lines.length ? lines.join('\n') : 'I could not find matches right now.'
      );
    } catch (err) {
      console.error('Error fetching matches:', err);
      bot.sendMessage(chatId, 'Failed to fetch matches.');
    }
    return;
  }

  if (!openai) return;

  try {
    const intent = await extractIntent(text);
    let endpoint = `${API_BASE_URL}/matches-today`;
    if (intent && intent.date) {
      const d = intent.date.toLowerCase();
      if (d === 'tomorrow') endpoint = `${API_BASE_URL}/matches-tomorrow`;
      else if (d !== 'today') endpoint = `${API_BASE_URL}/matches-week`;
    } else if (intent && Array.isArray(intent.teams) && intent.teams.length) {
      // Search the upcoming week when looking for a team without a specific date
      endpoint = `${API_BASE_URL}/matches-week`;
    }
    let matchesRes = await axios.get(endpoint);
    let matches = matchesRes.data || [];
    if (intent && intent.date) {
      const d = intent.date.toLowerCase();
      const isSpecific = /^\d{4}-\d{2}-\d{2}$/.test(intent.date);
      if (!['today', 'tomorrow'].includes(d) && isSpecific) {
        matches = matches.filter((m) => m.fixture.date.startsWith(intent.date));
      }
    }
    if (intent && Array.isArray(intent.teams) && intent.teams.length) {
      matches = matches.filter((m) =>
        intent.teams.every((team) =>
          `${m.teams.home.name} ${m.teams.away.name}`
            .toLowerCase()
            .includes(team.toLowerCase())
        )
      );
    }

    const lines = matches.slice(0, 5).map(describeMatch);
    bot.sendMessage(
      chatId,
      lines.length
        ? lines.join('\n')
        : 'No upcoming matches found for your query.'
    );
  } catch (err) {
    console.error('Natural language error:', err);
    bot.sendMessage(chatId, 'Sorry, I could not process your request.');
  }
});
// /today, /tomorrow, /recommend, /rules, /results commands as before

bot.onText(/\/today/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const res = await axios.get(`${API_BASE_URL}/matches-today`);
    const lines = (res.data || []).slice(0, 5).map(describeMatch);
    bot.sendMessage(
      chatId,
      lines.length ? lines.join('\n') : 'No matches found.'
    );
  } catch (err) {
    console.error('Error fetching matches:', err);
    bot.sendMessage(chatId, 'Failed to fetch matches.');
  }
});

bot.onText(/\/tomorrow/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const res = await axios.get(`${API_BASE_URL}/matches-tomorrow`);
    const lines = (res.data || []).slice(0, 5).map(describeMatch);
    bot.sendMessage(
      chatId,
      lines.length ? lines.join('\n') : 'No matches found.'
    );
  } catch (err) {
    console.error('Error fetching matches:', err);
    bot.sendMessage(chatId, 'Failed to fetch matches.');
  }
});

bot.onText(/\/recommend/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = String(msg.from.id);
  try {
      const res = await axios.get(`${API_BASE_URL}/recommend`, {
      params: { userId: telegramId },
    });
    const lines = (res.data || [])
      .slice(0, 5)
      .map((r) => {
        const odd = r.odd ? ` at ${r.odd}` : '';
        const reason = r.rationale ? ` because ${r.rationale}` : '';
        return `${r.teams.home.name} face ${r.teams.away.name}; consider ${r.recommendedBet}${odd}${reason}.`;
      });
    bot.sendMessage(
      chatId,
      lines.length ? lines.join('\n') : 'No recommendations found.'
    );
  } catch (err) {
    console.error('Error fetching recommendations:', err);
    bot.sendMessage(chatId, 'Failed to fetch recommendations.');
  }
});

bot.onText(/\/rules(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const telegramId = String(msg.from.id);
  const payload = match[1];
  if (payload) {
    try {
      const rules = JSON.parse(payload);
      await axios.post(`${API_BASE_URL}/user/${telegramId}/rules`, rules);
      bot.sendMessage(chatId, 'Rules updated.');
    } catch (err) {
      console.error('Error updating rules:', err);
      bot.sendMessage(chatId, 'Failed to update rules. Make sure the format is valid JSON.');
    }
    return;
  }
  try {
    const res = await axios.get(`${API_BASE_URL}/user/${telegramId}/rules`);
    if (res.data && res.data.rules) {
      bot.sendMessage(chatId, JSON.stringify(res.data.rules, null, 2));
    } else {
      bot.sendMessage(chatId, 'No rules found.');
    }
  } catch (err) {
    console.error('Error fetching rules:', err);
    bot.sendMessage(chatId, 'Failed to fetch rules.');
  }
});

bot.onText(/\/results(?:\s+(\d{4}-\d{2}-\d{2}))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const date = match[1];
  const params = date ? { date } : {};
  try {
    const res = await axios.get(`${API_BASE_URL}/results`, { params });
    const lines = (res.data.response || [])
      .slice(0, 5)
      .map((r) => {
        const home = r.teams.home.name;
        const away = r.teams.away.name;
        return `${home} ${r.goals.home} to ${r.goals.away} ${away}.`;
      });
    bot.sendMessage(
      chatId,
      lines.length ? lines.join('\n') : 'No results found.'
    );
  } catch (err) {
    console.error('Error fetching results:', err);
    bot.sendMessage(chatId, 'Failed to fetch results.');
  }
});

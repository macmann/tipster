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
  return (
    values.map((v) => `${v.value || v.name}: ${v.odd}`).join(', ') || 'N/A'
  );
}

function formatPrediction(match) {
  const ai = match.aiPrediction || 'N/A';
  const human = match.humanPrediction
    ? `, Human: ${match.humanPrediction}`
    : '';
  return `AI: ${ai}${human}`;
}

// Lightweight intent extraction with OpenAI for date/teams
async function extractIntent(text) {
  if (!openai) throw new Error('OpenAI API key not configured');
  const systemPrompt =
    'Extract the intended date (today, tomorrow or YYYY-MM-DD) and optional team names from the user question. ' +
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
  if (jsonMatch) content = jsonMatch[0];
  return JSON.parse(content);
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
      const lines = (res.data || [])
        .slice(0, 5)
        .map((m) => {
          const kickoff = m.fixture?.date
            ? new Date(m.fixture.date).toLocaleString()
            : '-';
          return `${m.teams.home.name} vs ${m.teams.away.name} (${kickoff}) - Odds: ${formatOdds(m)} - Prediction: ${formatPrediction(m)}`;
        })
        .join('\n');

      const response =
        lines
          ? `${lines}\n\nIf you want more or prediction about specific match, pls ask`
          : 'No matches found. If you want more or prediction about specific match, pls ask';
      bot.sendMessage(chatId, response);
    } catch (err) {
      console.error('Error fetching matches:', err);
      bot.sendMessage(
        chatId,
        'Failed to fetch matches. If you want more or prediction about specific match, pls ask'
      );
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

    const lines = matches
      .slice(0, 5)
      .map((m) => {
        const kickoff = m.fixture?.date
          ? new Date(m.fixture.date).toLocaleString()
          : '-';
        return `${m.teams.home.name} vs ${m.teams.away.name} (${kickoff}) - Odds: ${formatOdds(m)} - Prediction: ${formatPrediction(m)}`;
      })
      .join('\n');

    const response =
      lines
        ? `${lines}\n\nIf you want more or prediction about specific match, pls ask`
        : 'No upcoming matches found for your query. If you want more or prediction about specific match, pls ask';
    bot.sendMessage(chatId, response);
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
    const lines = (res.data || [])
      .slice(0, 5)
      .map((m) => {
        const kickoff = m.fixture?.date
          ? new Date(m.fixture.date).toLocaleString()
          : '-';
        return `${m.teams.home.name} vs ${m.teams.away.name} (${kickoff}) - Odds: ${formatOdds(
          m
        )} - Prediction: ${formatPrediction(m)}`;
      })
      .join('\n');
    const response =
      lines
        ? `${lines}\n\nIf you want more or prediction about specific match, pls ask`
        : 'No matches found. If you want more or prediction about specific match, pls ask';
    bot.sendMessage(chatId, response);
  } catch (err) {
    console.error('Error fetching matches:', err);
    bot.sendMessage(chatId, 'Failed to fetch matches.');
  }
});

bot.onText(/\/tomorrow/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const res = await axios.get(`${API_BASE_URL}/matches-tomorrow`);
    const lines = (res.data || [])
      .slice(0, 5)
      .map((m) => {
        const kickoff = m.fixture?.date
          ? new Date(m.fixture.date).toLocaleString()
          : '-';
        return `${m.teams.home.name} vs ${m.teams.away.name} (${kickoff}) - Odds: ${formatOdds(
          m
        )} - Prediction: ${formatPrediction(m)}`;
      })
      .join('\n');
    const response =
      lines
        ? `${lines}\n\nIf you want more or prediction about specific match, pls ask`
        : 'No matches found. If you want more or prediction about specific match, pls ask';
    bot.sendMessage(chatId, response);
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
        const odd = r.odd ? r.odd : 'N/A';
        const rationale = r.rationale ? ` - Reason: ${r.rationale}` : '';
        return `${r.teams.home.name} vs ${r.teams.away.name} - Bet: ${r.recommendedBet} @ ${odd}${rationale}`;
      })
      .join('\n');
    bot.sendMessage(chatId, lines || 'No recommendations found.');
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
      .map((r) => `${r.teams.home.name} ${r.goals.home} - ${r.goals.away} ${r.teams.away.name}`)
      .join('\n');
    bot.sendMessage(chatId, lines || 'No results found.');
  } catch (err) {
    console.error('Error fetching results:', err);
    bot.sendMessage(chatId, 'Failed to fetch results.');
  }
});

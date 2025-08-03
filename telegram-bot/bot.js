require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const axios = require('axios');
const OpenAI = require('openai');

const User = require('./models/User');

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error('BOT_TOKEN not specified in .env');
}

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

// Main natural language handler with API data injection
bot.on('message', async (msg) => {
  const text = msg.text;
  if (!text || text.startsWith('/')) return;
  if (!openai) return;

  try {
    // 1. Extract intent (date, teams)
    const intent = await extractIntent(text);

    // 2. Fetch matches
    let endpoint = 'http://localhost:4000/matches-today';
    if (intent && intent.date) {
      const d = intent.date.toLowerCase();
      if (d === 'tomorrow') endpoint = 'http://localhost:4000/matches-tomorrow';
      else if (d !== 'today') endpoint = 'http://localhost:4000/matches-week';
    }
    let matchesRes = await axios.get(endpoint);
    let matches = matchesRes.data || [];
    if (intent && intent.date && !['today', 'tomorrow'].includes(intent.date.toLowerCase())) {
      matches = matches.filter((m) => m.fixture.date.startsWith(intent.date));
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

    // 3. Fetch historical results for the pair (if both teams provided)
    let historyText = '';
    if (intent && Array.isArray(intent.teams) && intent.teams.length === 2) {
      const teamA = intent.teams[0];
      const teamB = intent.teams[1];
      try {
        const resultsRes = await axios.get('http://localhost:4000/results', {
          params: { teamA, teamB },
        });
        const history = resultsRes.data?.history || [];
        if (history.length > 0) {
          historyText =
            `Previous results for ${teamA} vs ${teamB}:\n` +
            history.map(h => `${h.date}: ${h.teams.home} ${h.goals.home} - ${h.goals.away} ${h.teams.away}`).join('\n');
        }
      } catch (err) {
        // Ignore if API fails, just leave historyText empty
      }
    }

    // 4. Prepare match text for OpenAI
    const matchText =
      matches.length > 0
        ? 'Upcoming matches:\n' +
          matches.map(m =>
            `${m.teams.home.name} vs ${m.teams.away.name} (${new Date(m.fixture.date).toLocaleString()}) Odds: ${formatOdds(m)}`
          ).join('\n')
        : 'No upcoming matches found for your query.';

    // 5. Inject all info into OpenAI user message
    const contextForOpenAI =
      `${matchText}\n\n${historyText ? historyText + '\n\n' : ''}User question: ${text}`;

    const systemPrompt =
      'You are a football betting expert. Use the provided match data and previous results to provide informed recommendations. ' +
      'If you do not see any relevant matches, say so. Otherwise, analyze the provided data, include a greeting, show the extracted date/teams as JSON, and give your statistics and recommendation.';

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contextForOpenAI },
      ],
    });

    const answer = resp.choices[0]?.message?.content?.trim() || '';
    bot.sendMessage(msg.chat.id, answer);

  } catch (err) {
    console.error('Natural language error:', err);
    bot.sendMessage(msg.chat.id, 'Sorry, I could not process your request.');
  }
});

// /today, /tomorrow, /recommend, /rules, /results commands as before

bot.onText(/\/today/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const res = await axios.get('http://localhost:4000/matches-today');
    const lines = (res.data || [])
      .slice(0, 5)
      .map((m) => {
        const kickoff = m.fixture?.date
          ? new Date(m.fixture.date).toLocaleString()
          : '-';
        return `${m.teams.home.name} vs ${m.teams.away.name} (${kickoff})\nOdds: ${formatOdds(
          m
        )}`;
      })
      .join('\n\n');
    bot.sendMessage(chatId, lines || 'No matches found.');
  } catch (err) {
    console.error('Error fetching matches:', err);
    bot.sendMessage(chatId, 'Failed to fetch matches.');
  }
});

bot.onText(/\/tomorrow/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const res = await axios.get('http://localhost:4000/matches-tomorrow');
    const lines = (res.data || [])
      .slice(0, 5)
      .map((m) => {
        const kickoff = m.fixture?.date
          ? new Date(m.fixture.date).toLocaleString()
          : '-';
        return `${m.teams.home.name} vs ${m.teams.away.name} (${kickoff})\nOdds: ${formatOdds(
          m
        )}`;
      })
      .join('\n\n');
    bot.sendMessage(chatId, lines || 'No matches found.');
  } catch (err) {
    console.error('Error fetching matches:', err);
    bot.sendMessage(chatId, 'Failed to fetch matches.');
  }
});

bot.onText(/\/recommend/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = String(msg.from.id);
  try {
    const res = await axios.get('http://localhost:4000/recommend', {
      params: { userId: telegramId },
    });
    const lines = (res.data || [])
      .slice(0, 5)
      .map((r) => {
        const odd = r.odd ? r.odd : 'N/A';
        const rationale = r.rationale ? `Reason: ${r.rationale}` : '';
        return `${r.teams.home.name} vs ${r.teams.away.name}\nBet: ${r.recommendedBet} @ ${odd}\n${rationale}`;
      })
      .join('\n\n');
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
      await axios.post(`http://localhost:4000/user/${telegramId}/rules`, rules);
      bot.sendMessage(chatId, 'Rules updated.');
    } catch (err) {
      console.error('Error updating rules:', err);
      bot.sendMessage(chatId, 'Failed to update rules. Make sure the format is valid JSON.');
    }
    return;
  }
  try {
    const res = await axios.get(`http://localhost:4000/user/${telegramId}/rules`);
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
    const res = await axios.get('http://localhost:4000/results', { params });
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

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');

const User = require('./models/User');

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error('BOT_TOKEN not specified in .env');
}

const openaiKey = process.env.OPENAI_API_KEY;
const openai = openaiKey
  ? new OpenAIApi(new Configuration({ apiKey: openaiKey }))
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

async function interpretQuery(text) {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }
  const systemPrompt =
    'Extract the intended date (today, tomorrow or YYYY-MM-DD) and optional team names from the user question. ' +
    'Respond with JSON in the form {"date": "today|tomorrow|YYYY-MM-DD", "teams": ["Team A", "Team B"]} and nothing else.';
  const resp = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ],
  });
  const content = resp.data.choices[0].message.content.trim();
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error('Unable to parse OpenAI response');
  }
}

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

bot.on('message', async (msg) => {
  const text = msg.text;
  if (!text || text.startsWith('/')) return;
  if (!openai) return; // skip if OpenAI not configured

  try {
    const query = await interpretQuery(text);
    let endpoint = 'http://localhost:4000/matches-today';
    if (query.date) {
      const d = query.date.toLowerCase();
      if (d === 'tomorrow') endpoint = 'http://localhost:4000/matches-tomorrow';
      else if (d !== 'today') {
        // For arbitrary dates fallback to week matches and filter
        endpoint = 'http://localhost:4000/matches-week';
      }
    }
    const res = await axios.get(endpoint);
    let matches = res.data || [];

    if (query.date && !['today', 'tomorrow'].includes(query.date.toLowerCase())) {
      matches = matches.filter((m) => m.fixture.date.startsWith(query.date));
    }

    if (Array.isArray(query.teams) && query.teams.length) {
      matches = matches.filter((m) =>
        query.teams.every((team) =>
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
        return `${m.teams.home.name} vs ${m.teams.away.name} (${kickoff})\nOdds: ${formatOdds(
          m
        )}`;
      })
      .join('\n\n');

    bot.sendMessage(msg.chat.id, lines || 'No matches found.');
  } catch (err) {
    console.error('Natural language error:', err);
    bot.sendMessage(msg.chat.id, 'Sorry, I could not understand your request.');
  }
});

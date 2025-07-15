require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const axios = require('axios');

const User = require('./models/User');

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error('BOT_TOKEN not specified in .env');
}

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

bot.onText(/\/today/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const res = await axios.get('http://localhost:4000/matches-today');
    const lines = (res.data || [])
      .slice(0, 5)
      .map((m) => `${m.teams.home.name} vs ${m.teams.away.name}`)
      .join('\n');
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
      .map((r) => `${r.teams.home.name} vs ${r.teams.away.name} - ${r.recommendedBet} @ ${r.odd}`)
      .join('\n');
    bot.sendMessage(chatId, lines || 'No recommendations found.');
  } catch (err) {
    console.error('Error fetching recommendations:', err);
    bot.sendMessage(chatId, 'Failed to fetch recommendations.');
  }
});

bot.onText(/\/rules/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = String(msg.from.id);
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

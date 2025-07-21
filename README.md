# Tipster

Tipster is a small demo project that fetches football match data from the [API-Football](https://www.api-football.com/) service and provides simple betting recommendations.  The repository contains three Node.js based services:

- **backend/** – Express API that queries API‑Football, stores user rules in MongoDB and exposes endpoints for matches, results and recommendations.
- **frontend/** – Next.js web client to browse matches and manage rules.
- **telegram-bot/** – Telegram bot that delivers recommendations and match info via chat.

## Prerequisites

- Node.js (version 18 or later is recommended)
- A running MongoDB instance
- API keys for API‑Football and Telegram (see the `.env.example` files)

## Getting Started

Each sub directory is an independent Node.js project.  Install dependencies and create an `.env` file using the provided examples.

```bash
cd backend
cp .env.example .env  # edit values
npm install
npm start             # starts the Express server on port 4000
```

```bash
cd frontend
npm install
npm run dev           # launches Next.js on http://localhost:3000
```

```bash
cd telegram-bot
cp .env.example .env  # edit BOT_TOKEN and MONGODB_URI
npm install
node bot.js           # starts the Telegram bot
```

The frontend expects the backend to run on `http://localhost:4000`.  The Telegram bot also calls the backend on this address.

## API Endpoints

The backend exposes a few JSON endpoints:

- `/matches-today` – list today’s fixtures with odds
- `/matches-tomorrow` – fixtures for tomorrow
- `/matches-week` – fixtures for the next seven days
- `/recommend?userId=ID` – recommendations for a user
- `/user/:id/rules` – save or read a user’s rules
- `/results?date=YYYY-MM-DD` – final scores for a date

## Telegram Commands

The bot responds to the following commands:

- `/start` – register and greet the user
- `/today` – today’s matches
- `/tomorrow` – tomorrow’s matches
- `/recommend` – show recommendations
- `/rules` or `/rules {json}` – get or set user rules
- `/results` or `/results YYYY-MM-DD` – view results for a day

## License

This project is provided under the ISC license.  See the individual package.json files for details.


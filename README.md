# Tipster

Tipster is a simple football tipping toolkit built as a Node.js monorepo. It contains an Express backend, a Next.js web frontend and a Telegram bot. All services share a MongoDB database for storing users and custom betting rules.

## Features

- Fetch fixtures and odds from the API-Football service
- Store user specific rules such as minimum odds
- Generate bet recommendations based on those rules
- Web UI to view matches and tips
- Telegram bot commands for quick access

## Repository layout

```
backend/       Express API service
frontend/      Next.js web application
telegram-bot/  Telegram bot
```

## Environment variables

### backend/.env
Copy `backend/.env.example` to `backend/.env` and provide your values:

```
MONGODB_URI=mongodb://localhost:27017/tipster
PORT=4000
API_FOOTBALL_KEY=<your-api-football-key>
```

### telegram-bot/.env
Create `telegram-bot/.env` with the following variables:

```
BOT_TOKEN=<your-telegram-bot-token>
MONGODB_URI=mongodb://localhost:27017/tipster
```

### frontend/.env (optional)
If the frontend should target a different API URL, set:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Running the services

### Backend

```
cd backend
npm install
npm start                # starts on http://localhost:4000
```

For production you can run `NODE_ENV=production npm start`.

### Frontend

```
cd frontend
npm install
npx next dev             # development server on http://localhost:3000
```

To build for production:

```
npx next build
npx next start
```

### Telegram bot

```
cd telegram-bot
npm install
node bot.js
```

Use `NODE_ENV=production node bot.js` when deploying.

## Example API usage

```
# Get today's matches
curl http://localhost:4000/matches-today

# Save rules for a user
curl -X POST http://localhost:4000/user/123/rules \
  -H 'Content-Type: application/json' \
  -d '{"minOdds":2}'

# Request recommendations for that user
curl http://localhost:4000/recommend?userId=123
```


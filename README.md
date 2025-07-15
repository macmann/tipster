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

- `/today` – show today's matches with basic odds information.
- `/tomorrow` – list tomorrow's matches and odds.
- `/recommend` – get bet recommendations along with reasoning based on your saved rules.
- `/results [YYYY-MM-DD]` – show final scores for the given day (defaults to today).
- `/rules` – display current rules. Send `/rules {"minOdds":2}` to update your configuration using JSON.

## Environment Setup

Example `.env.example` files are provided in the `backend` and `telegram-bot` folders. Copy these files to `.env` and replace the placeholder values with your credentials.

### backend/.env

- `MONGODB_URI` – MongoDB connection string  
- `API_FOOTBALL_KEY` – API key from api-football  
- `PORT` – optional port for the Express server

### telegram-bot/.env

- `MONGODB_URI` – MongoDB connection string
- `BOT_TOKEN` – token from BotFather (also exported as `BOT_TOKEN`)

## Deployment

### MongoDB Atlas
- Sign up for a free MongoDB Atlas account and create a cluster.
- Create a database named `tipster` and whitelist your server's IP.
- Copy the connection string and use it as `MONGODB_URI` in your `.env` files.

### Backend (Render or Heroku)
- Push the `backend` folder to a Git repository.
- Create a new service on [Render](https://render.com/) or [Heroku](https://www.heroku.com/) and connect the repo.
- Add the environment variables from `backend/.env`.
- Deploy the service and note the public URL.

### Frontend (Vercel or Netlify)
- Push the `frontend` folder to a Git repository.
- Import the repo in [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/).
- Set `NEXT_PUBLIC_API_URL` to your backend URL if it differs from the default.
- Deploy to obtain your web app's URL.

### Telegram bot
- Push `telegram-bot` to a Git repository or copy it to your own server.
- On Render, create a new service with `node bot.js` as the start command.
- Provide `BOT_TOKEN` and `MONGODB_URI` as environment variables.
- If self-hosting, ensure the bot runs on a public IP or domain.


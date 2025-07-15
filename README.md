# Monorepo Project

This repository contains three Node.js projects managed as workspaces:

- **backend** – Express API service.
- **frontend** – Next.js web application.
- **telegram-bot** – Telegram bot service.

Each folder contains its own `package.json` created with `npm init -y`. The source files are placeholders for further development.

## Backend API

The Express server in `backend` exposes the following endpoints:

- `GET /matches-today` – return today's matches enriched with odds.
- `GET /matches-tomorrow` – return tomorrow's matches and odds.
- `GET /matches-week` – return matches with odds for the next seven days.
- `GET /recommend?userId=ID` – return recommended bets for the given user based on their stored rules.
- `POST /user/:id/rules` – save or update rules for a user.
- `GET /user/:id/rules` – retrieve rules for a user.
- `GET /results?date=YYYY-MM-DD` – fetch completed match results for the given date (defaults to today).

## Telegram Bot Commands

The bot connects to the backend API and supports several commands:

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
- `TELEGRAM_BOT_TOKEN` – token from BotFather (also exported as `BOT_TOKEN`)

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

# Nutri — AI Nutrition Tracker

A nutrition tracking app powered by Claude. Log meals in natural language or with photos; Claude estimates macros automatically.

## Local setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and add your Anthropic API key
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com/new and import the repo.
3. In **Environment Variables**, add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your key from https://console.anthropic.com
4. Click **Deploy**.

That's it. Vercel injects the env var server-side; your API key is never exposed to the browser.

## How it works

- `pages/index.js` — the entire React UI
- `pages/api/log-meal.js` — serverless function that calls the Anthropic API server-side
- `localStorage` — persists today's meals, targets, and history in the browser
- History is keyed by date string (`history:YYYY-MM-DD`)

## Notes

- Data lives in the user's browser localStorage. Each device/browser has its own data.
- If you want cross-device sync, swap localStorage for a database (e.g. Vercel KV, Supabase).

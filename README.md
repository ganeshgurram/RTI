# RTI Online Redesign

Full-stack RTI Online redesign prototype for the Build What Moves India hackathon.

This repository contains a Vite + React + TypeScript app using React Router, Tailwind CSS, and shadcn/ui with Base UI primitives, plus an Express API backed by MongoDB Atlas. Authentication, profiles, requests, appeals, payments, status lookup, and notification read state are persisted through the API.

## Project Structure

```text
.
├── frontend/          # Vite React application
├── .github/workflows/ # GitHub Actions CI
├── .env.example       # Environment variable template
├── .nvmrc             # Node version hint
└── package.json       # Root convenience scripts
```

## Requirements

- Node.js `>=20.19.0`
- npm

The current local version used while preparing the repo is Node `22.19.0`.

## Setup

From the repository root:

```bash
npm run setup
npm run dev
```

`npm run dev` starts the Express API and Vite application together. The web app proxies its API calls to the local API in development.

The web app and API run at:

```text
http://localhost:5173/
http://127.0.0.1:8787/api/health
```

Create `frontend/.env.local` from `frontend/.env.example` and set `MONGODB_URI` to your Atlas connection string before starting the app. Do not commit this file.

You can also work directly inside the frontend app:

```bash
cd frontend
npm install
npm run dev
```

## Scripts

From the repository root:

```bash
npm run dev      # Start the Express API and Vite app
npm run dev:api  # Start only the Express API
npm run dev:web  # Start only the Vite app
npm run build    # Type-check and build production assets
npm run lint     # Run oxlint
npm run check    # Check the API and build the frontend
npm run preview  # Preview production build
```

## Notes

- Do not commit `.env`, `node_modules/`, or `dist/`.
- The app is an independent prototype and should not be presented as an official government service.
- Use mock/sample data only. Do not enter real personal, OTP, or payment details.
## RTI Sahayak chatbot

RTI Sahayak is available on every page and answers general questions about using the RTI portal. It blocks likely sensitive data in the browser before sending a message and repeats that validation in the server route. Chat history stays in memory only and can be cleared at any time.

Switching the portal language keeps the conversation and re-renders it, so earlier messages are shown in the newly selected language rather than being cleared. Text the portal itself writes is held in both languages already; anything the model wrote is translated once and then cached against the message, so switching back and forth costs nothing after the first pass. If a translation cannot be obtained the original text is kept and the panel says so, which reads in the wrong language but never puts the wrong words under a speaker.

The project includes serverless handlers in `frontend/api/`: `rti-sahayak.js` serves the text chat feature, while `[...path].js` exports the modular Express API for the rest of `/api/*`. To activate live services, deploy with frontend as the project root and set server-side environment variables. Never use a `VITE_` prefix for secrets.

### Running RTI Sahayak locally

1. Create frontend/.env.local from frontend/.env.example (recommended), or add the key to the repository root .env.
2. Add your OpenRouter OPENROUTER_API_KEY. Do not use a VITE_ prefix. The project defaults to
   `OPENROUTER_MODEL=openrouter/free`, so it uses one of OpenRouter's currently available
   zero-cost models rather than a paid model. Free models are rate-limited and their availability
   can change; set `OPENROUTER_MODEL` to a specific model only if you later choose to do so.
3. Run npm run dev from the repository root.

The Vite development server invokes the same secure API handler as the deployed serverless route. Token usage is recorded in the terminal only, as numeric input, output, and total counts per call; the chat widget shows the applicant nothing about tokens or model limits. The response cap is 900 tokens per request.

### Gemini Live voice assistant

The floating voice control uses Gemini Live native audio for both speech input and spoken output. It starts only after an applicant clicks it, waits for “Hey RTI” (or “हे आरटीआई”), and records the completed spoken turns in the ordinary RTI Sahayak chat panel for that browser session.

Set `GEMINI_API_KEY` in `frontend/.env.local` locally and in Vercel for deployed environments. The browser never receives that key: `POST /api/voice/token` creates a one-use, short-lived Gemini token, while personal request lookups stay behind the existing HttpOnly session cookie. Voice can read the caller's request history or an individual request status and navigate to portal pages; it cannot submit requests, make payments, or change profile data.

### Deploying to Vercel

The site, Express API, and chat endpoint deploy together. Vercel serves the Vite assets and runs `frontend/api/[...path].js` as the same-origin Express API; `frontend/api/rti-sahayak.js` remains the dedicated chat function. Same-origin routing keeps the HttpOnly `rti_session` cookie first-party, so no separate API URL is needed.

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Vite (build `npm run build`, output `dist`) |
| Environment Variable | `OPENROUTER_API_KEY` — no `VITE_` prefix, all environments |

Set these Vercel environment variables for Production, Preview, and Development as appropriate:

- `MONGODB_URI`: MongoDB Atlas connection string.
- `OPENROUTER_API_KEY`: required only for live RTI Sahayak replies.
- `GEMINI_API_KEY`: required only for Gemini Live voice sessions.
- `GEMINI_LIVE_MODEL=gemini-2.5-flash-native-audio-latest`: optional override for the supported native-audio model.
- `NODE_ENV=production`: makes the session cookie Secure.
- `SEED_DEMO_DATA=true`: seeds the mock portal data; set it to `false` for a real-data deployment.

Two things the project already carries so this works:

- `frontend/vercel.json` rewrites unmatched paths to `/index.html`, because `App.tsx` uses `createBrowserRouter` and a hard reload of `/faq` would otherwise 404. The `(?!api/)` lookahead in the rewrite keeps `/api/rti-sahayak` routed to the function rather than being swallowed by the SPA shell — without it the chatbot silently falls back to local replies.
- `engines.node` in `frontend/package.json`, since the repo-root `.nvmrc` is outside the configured Root Directory and Vercel will not read it.

Set a spend cap on the OpenRouter key before the deployment is public. The function is unauthenticated, so anyone who finds the URL can spend credits against it.

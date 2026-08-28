# RTI Online Redesign

Frontend-only redesign prototype for the RTI Online portal, built for the Build What Moves India hackathon.

This repository contains a Vite + React + TypeScript app using React Router, Tailwind CSS, and shadcn/ui with Base UI primitives. Backend behavior, auth, payment, status, and dashboard data are mocked in the frontend.

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

`npm run dev`, `npm run build`, and `npm run lint` automatically synchronize frontend dependencies when a pull changes `frontend/package.json` or `frontend/package-lock.json`. This prevents missing-module errors after pulling dependency updates.

The app runs at:

```text
http://127.0.0.1:5173/
```

You can also work directly inside the frontend app:

```bash
cd frontend
npm install
npm run dev
```

## Scripts

From the repository root:

```bash
npm run dev      # Start Vite dev server
npm run build    # Type-check and build production assets
npm run lint     # Run oxlint
npm run preview  # Preview production build
```

## Notes

- Do not commit `.env`, `node_modules/`, or `dist/`.
- The app is an independent prototype and should not be presented as an official government service.
- Use mock/sample data only. Do not enter real personal, OTP, or payment details.
## RTI Sahayak chatbot

RTI Sahayak is available on every page and answers general questions about using the RTI portal. It blocks likely sensitive data in the browser before sending a message and repeats that validation in the server route. Chat history stays in memory only and can be cleared at any time.

Switching the portal language keeps the conversation and re-renders it, so earlier messages are shown in the newly selected language rather than being cleared. Text the portal itself writes is held in both languages already; anything the model wrote is translated once and then cached against the message, so switching back and forth costs nothing after the first pass. If a translation cannot be obtained the original text is kept and the panel says so, which reads in the wrong language but never puts the wrong words under a speaker.

The project includes a serverless handler at frontend/api/rti-sahayak.js configured for OpenRouter with GPT-5.6 Luna (openai/gpt-5.6-luna). To activate live AI answers, deploy with frontend as the project root and set OPENROUTER_API_KEY in the host's server-side environment variables. Never use a VITE_ prefix or put the key in browser code. Without a configured server route, the widget safely falls back to local guidance for the demo.

### Running Luna locally

1. Create frontend/.env.local from frontend/.env.example (recommended), or add the key to the repository root .env.
2. Add your OpenRouter OPENROUTER_API_KEY. Do not use a VITE_ prefix.
3. Run npm run dev from the repository root.

The Vite development server invokes the same secure API handler as the deployed serverless route. Token usage is recorded in the terminal only, as numeric input, output, and total counts per call; the chat widget shows the applicant nothing about tokens or model limits. The response cap is 1,200 tokens per request.

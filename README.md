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

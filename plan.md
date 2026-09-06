# RTI Online — Complete Project Plan

## 1. Product purpose

**RTI Online** is a full-stack prototype that makes India’s Right to Information journey clearer, more accessible, and easier to complete. It turns a fragmented process—finding the right public authority, writing a request, paying a fee, tracking status, and filing an appeal—into one connected digital experience.

The product is designed around a simple principle: citizens should be able to begin with their real-world problem, not with legal jargon or knowledge of government departments.

This is an independent prototype for Build What Moves India. It is not an official government service and must use mock data unless a future authorised integration is in place.

## 2. Problem being solved

The RTI Act gives citizens the right to request information from public authorities, but the online journey can still be difficult for a first-time user.

- A citizen may not know which ministry, department, or public authority holds the information.
- They may have a genuine issue but not know how to express it as a request for records rather than an opinion, grievance, or complaint.
- Rules on BPL exemptions, fees, payment reconciliation, statutory timelines, and appeals are hard to discover at the moment they matter.
- Users often have to repeat personal details across flows and then search separately for their request status.
- Language, digital confidence, accessibility, and formal writing are meaningful barriers before a person can even begin.

RTI Online addresses those barriers with clear journeys, searchable authority discovery, guided forms, profile reuse, status tracking, deadline-aware next steps, and optional AI and voice assistance.

## 3. Product scope and experience model

### Public journeys

1. **Explore and understand** — Home, FAQ, contact information, public-authority directory, RTI lifecycle, and service updates.
2. **Find the right authority** — Search and filter public authorities, view an authority’s details, and carry the selected authority directly into a request.
3. **File an RTI request** — Read mandatory guidelines, complete a guided request form, review details, handle BPL or mock-payment paths, and receive a registration number.
4. **Check a request without signing in** — Enter a registration number, email address, and captcha; view the retrieved request and print only that application.
5. **File a First Appeal** — Read appeal-specific guidance, validate the original RTI, prefill eligible information, prepare appeal grounds, review, and submit.
6. **Understand Second Appeal** — Explain that a Second Appeal is handled by the appropriate Information Commission rather than pretending to file it through this prototype.

### Signed-in journeys

1. **Authentication** — Sign up, sign in, sign out, and a clearly labelled DigiLocker authorisation simulation.
2. **Applicant profile** — Store and edit applicant contact, address, demographic, and educational details; reuse relevant details while filing.
3. **Request history and detail** — Browse paginated, filterable requests; open a complete detail view with submitted content, status, payment, timeline, and relevant next actions.
4. **Notifications** — See read and unread updates, mark individual or all notifications as read, and open the corresponding request or appeal journey.
5. **Payment and reconciliation** — Continue the mock payment flow, see transaction status, and reconcile a payment reference when needed.

### Assisted journeys

1. **Rewrite with AI** — Turn a rough request or First Appeal draft into clearer, information-focused wording while the user controls the final text.
2. **RTI Sahayak chat** — Ask general process questions, receive local authority suggestions, and get safe portal guidance without sharing sensitive information.
3. **File with RTI Sahayak** — Describe an issue in plain language, receive an editable authority and request draft, then enter the standard guidelines and review-controlled filing flow.
4. **Voice Assistant** — Start an explicit microphone session, say “Hey RTI,” speak naturally, keep the voice conversation visible in chat, and navigate into a relevant drafting or portal journey.

## 4. What is delivered

### Core RTI workflow

- Responsive home page with a visible RTI lifecycle and first-visit guidance.
- Mandatory, scroll-to-acknowledge request and First Appeal guideline dialogs that return the user to the route they came from when cancelled.
- Compact, shadcn-style RTI request and First Appeal forms with responsive layouts.
- Profile-assisted personal-detail prefill for signed-in applicants.
- BPL-specific fields and fee handling that only appear when applicable.
- Request review, draft save/restore/discard controls, registration-number success views, and request-only printing.
- Mock payment, transaction-status, and payment-reconciliation journeys.
- First Appeal validation, eligibility guidance, prefill, review, and persistence into request history.
- A Second Appeal route that transparently directs citizens to the Information Commission path.

### Authority discovery and status

- Public Authorities directory built from organised authority data, with search, filtering, sorting, authority detail views, responsive cards, and responsive pagination.
- Authority recommendations for RTI Sahayak and the conversational filing journey.
- Signed-in request history with filters, pagination, consistent status chips, request detail pages, and deadlines.
- Public status lookup with captcha, automatic scroll to retrieved details, and request-only print output.
- Statutory deadline tracker with eligible First Appeal next steps and rights-oriented guidance.

### Account, data, and trust

- Applicant profile in dedicated Basic, Address, and Additional Information sections.
- HTTP-only session-cookie authentication rather than browser storage for sessions.
- MongoDB-backed users, sessions, profiles, requests, appeals, payments, and notification state.
- DigiLocker authorisation simulation that is visibly marked as simulated and does not claim a real government connection.
- Plain-language privacy and prototype notices.
- Client and server protections that prevent likely sensitive details—such as OTPs, passwords, Aadhaar/PAN, registration numbers, payment data, and documents—from being shared with RTI Sahayak.

### Accessibility, interface, and language

- Responsive layouts designed around viewport width, including tablet and mobile breakpoints.
- Shared non-FAQ navigation, profile dropdown behaviour, mobile menu, notification controls, and footer-safe floating assistance controls.
- English and Hindi portal translations.
- Telugu and Kannada language options, including supported-script fonts, navigation controls, service updates, RTI Sahayak, Voice Assistant copy, and AI language instructions.
- Static Telugu catalogue coverage is complete. Kannada currently has complete key coverage with English fallback for static strings that have not yet been professionally translated; this avoids missing or broken UI while keeping the language journey usable.
- Translation parity is checked in CI: **773 keys across English, Hindi, Telugu, and Kannada**.

### AI and voice

- AI rewrite on RTI request and First Appeal narratives.
- RTI Sahayak responses constrained to portal guidance and authority suggestions, not legal advice or case access.
- Local fallback guidance when the live text model is unavailable.
- Gemini Live native-audio voice interaction with explicit user activation, wake greeting, speech turns reflected in the chat panel, language-aware response instructions, and draft/navigation handoff.
- Server-side secret handling: Gemini and OpenRouter keys never use `VITE_` variables and are not sent to the browser.

## 5. Technical architecture

```text
React + TypeScript + Vite + Tailwind + shadcn/ui
                    │
                    ▼
          Same-origin Express API
                    │
                    ▼
              MongoDB Atlas

Optional assistance services
├── OpenRouter: RTI Sahayak text responses and AI rewrite
└── Gemini Live: short-lived voice-session tokens and native audio
```

### Frontend

- React 19, TypeScript, React Router, i18next, Tailwind CSS, shadcn/ui, and Base UI primitives.
- Route-based pages under `frontend/src/routes/`.
- Reusable components under `frontend/src/components/`.
- Static language catalogues under `frontend/src/locales/`.
- Vite proxy in local development; same-origin API routes in deployment.

### Backend and persistence

- Modular Express application in `frontend/server/`.
- Route modules for auth, health, profile, requests, payments, notifications, and voice tokens.
- MongoDB data layer with seeded, clearly mock demo data.
- `rti_session` HTTP-only cookie for authenticated requests.
- Dedicated serverless handlers for the modular API, RTI Sahayak, and voice speech where deployed.

### Deployment target

- Vercel with `frontend/` configured as the project root.
- Vite builds to `frontend/dist`; API is served through the same deployment.
- MongoDB Atlas remains private behind server-side environment variables.
- Required server-only configuration: `MONGODB_URI`; optional live-assistance configuration: `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, and `GEMINI_LIVE_MODEL`.

## 6. Safety and product boundaries

- Never present the prototype as an official RTI Online service.
- Never ask users to enter real OTPs, passwords, Aadhaar/PAN numbers, banking details, live payment information, or government credentials in a demo.
- Do not send profile details, contact information, uploaded files, request IDs, or payment references to an AI model.
- AI may guide, clarify, suggest an authority, or prepare an editable draft. The user always reviews the form and explicitly submits it.
- DigiLocker, payments, request status, and authority data are demo or mock flows unless an authorised production integration is built later.
- The assistant must never claim access to a citizen’s real government records, application status, or legal outcomes.

## 7. Phase 2 presentation plan

The Phase 2 video is a two-minute pitch, not a complete product tour.

### Minute 1 — Problem and project in action

Show the home page, language controls, authority discovery, a compact request form, and request history. Explain that Phase 1 delivered the connected RTI workflow; Phase 2 improves the barrier before filing: citizens often have a real problem but do not know the authority, formal wording, or correct first step.

### Minute 2 — Differentiator: RTI Sahayak Voice Assistant

Use one realistic example, such as a citizen seeking records about senior-citizen pension schemes. Show the user opening the Voice Assistant, saying “Hey RTI,” speaking the problem naturally, receiving guidance or a prepared draft direction, and moving into the standard review-controlled filing journey.

The key message is: **the citizen begins with their actual problem, not a government form or legal language.**

Use [project-pitch-scripts.md](project-pitch-scripts.md) as the final recording script and rehearsal checklist.

## 8. Current priorities before recording or deployment

### P0 — Demo reliability

- Confirm MongoDB Atlas network access, credentials, and seed data before every recorded or live demo.
- Test the complete local command: `npm run dev`, then `/api/health`, login, request submission, history, First Appeal, notification action, and public status lookup.
- Verify each required secret is present locally and in Vercel without exposing it in frontend code.
- Create or retain predictable demo accounts and requests so the video does not depend on random model output.
- Confirm graceful messages for unavailable MongoDB, OpenRouter, Gemini, microphone permission, and network failures.

### P1 — Demo-quality QA

- Test the principal flows at narrow mobile, tablet, and desktop viewport widths.
- Verify the navigation, dropdowns, dialogs, pagination, floating Sahayak controls, and print views on each key route.
- Rehearse the exact Phase 2 voice example with a reliable microphone and Chrome before recording.
- Reset demo data or use a dedicated seeded account before recording so statuses, notifications, and timelines are predictable.
- Test keyboard navigation, visible focus, labels, contrast, screen-reader landmarks, and reduced-motion behaviour.

### P2 — Translation quality

- Replace Kannada’s English static fallback entries with reviewed Kannada translations.
- Review Telugu wording with a fluent speaker and translate local helper copy that intentionally falls back to English outside the main i18n catalogue.
- Keep `check:i18n` passing whenever a new UI key is added.
- Add a language-review process before adding Tamil, Malayalam, or other languages; language count must not come at the cost of incomplete or inaccurate public-service wording.

### P3 — Performance and maintainability

- Introduce route-level code splitting for the large initial JavaScript bundle.
- Replace or reduce the global Material Symbols font payload where practical.
- Remove unused components only after verifying no route or demo depends on them.
- Add focused automated tests for authentication, request persistence, form validation, payment states, public status, First Appeal eligibility, and notification actions.
- Add explicit API error contracts and user-friendly recovery states to all live-service boundaries.

### P4 — Future authorised production work

- Real DigiLocker OAuth, subject to approved credentials, privacy review, and legal integration requirements.
- Real payment gateway integration and reconciliation, subject to PCI/security and government approval requirements.
- Verified public-authority dataset ingestion and update governance.
- Real government RTI submission, status, and appeal integrations only through authorised APIs and agreements.
- Audit logging, consent records, rate limits, abuse protection, security review, data-retention policy, and accessibility audit before handling real citizen data.
- Low-bandwidth/PWA support after core reliability is established.

## 9. Definition of done for the prototype

The project is ready for Phase 2 recording when all of the following are true:

- The app starts with `npm run dev` and the API health route succeeds against the intended Atlas environment.
- A user can complete the planned demo without manual data edits: sign in, use RTI Sahayak or voice, select an authority, submit a request, see it in history, and view its status.
- All routes used in the video are visually correct on the recording viewport.
- The assistant never exposes a secret, requests prohibited sensitive information, or claims real government access.
- The video uses mock data and states the prototype boundary where appropriate.
- The chosen Phase 2 differentiator is rehearsed within one minute and has a clear fallback recording path if the live AI service is unavailable.

## 10. Verification commands

Run these from the repository root before committing, recording, or deploying:

```bash
npm run check                    # API syntax checks + TypeScript + production build
npm run lint                     # Static linting
npm run eval:authorities         # Authority-recommendation evaluation
npm run eval:privacy             # Sensitive-data filter evaluation
```

Run these from `frontend/` for the checks not included by the root `check` command:

```bash
npm run check:i18n               # Translation key parity and t() call-site coverage
npm run eval:deadlines           # Deadline and appeal-eligibility evaluation
```

The production build currently warns about a large JavaScript chunk. Treat that as a P3 optimisation task unless it becomes visible during the recorded flow.

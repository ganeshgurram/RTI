# Plan — 7 September submission

Selected into the **top 250 of Build What Moves India**. Next submission **7 September 2026**.
The project is no longer a deadline prototype, so this plan weights durability and correctness
higher than the first round did.

Two tracks: **four new features**, and a **refinement backlog** from the 2 September audit.

---

## Track A — Features

### A1. AI-assisted RTI drafting

**The problem it solves.** The most common reason an RTI goes nowhere is not a hostile officer —
it is a badly-phrased request. Applicants ask for opinions, ask "why" questions, ask for
information that Section 8 exempts, or write a grievance letter instead of a request for records.
The portal currently lets them do all of that and find out 30 days later.

**What it does.** A "Help me write this" action beside the request text field. The applicant
describes the problem in plain language; the model returns a properly-worded RTI question, and
flags anything that is unlikely to be answerable — opinions and hypotheticals (not "information"
under s.2(f)), records exempt under s.8, and anything already in the public domain.

**Approach.** Reuses the existing OpenRouter handler at `frontend/api/rti-sahayak.js` — a new
`task` on the same endpoint rather than a second function, so there is one key, one origin, one
thing to deploy. The existing privacy filter (`containsSensitiveData`) must run on this path too;
the drafting box will attract exactly the personal detail the chat widget refuses.

**Open questions.** Whether the draft returns as replaceable text or as a suggestion the applicant
edits. Suggested wins on trust — the applicant stays the author of their own request.

---

### A2. Statutory deadline tracker

**The problem it solves.** The RTI Act's timelines are the applicant's only real leverage, and
almost nobody knows them. A missed deadline converts into concrete rights — free information, an
appeal, a penalty against the PIO — and those rights currently go unused because nothing tells
the applicant the clock ran out.

**What it does.** A live clock per request: "the PIO has 12 days left", and the moment it lapses,
the first-appeal action unlocks with a line explaining why it is now available.

**Timelines to encode** (verify each against the bare Act before shipping — this is the part
where being wrong is worse than being absent):

| Situation | Limit | Section |
|---|---|---|
| PIO reply | 30 days from receipt | s.7(1) |
| Life or liberty of a person | 48 hours | s.7(1) proviso |
| Filed via an APIO | +5 days (35 total) | s.5(2) |
| Third-party information involved | 40 days | s.11 |
| No reply in time | information supplied **free of charge** | s.7(6) |
| First appeal | within 30 days of the decision or the lapse | s.19(1) |
| First appellate authority must decide | 30 days, extendable to 45 with reasons | s.19(6) |
| Second appeal to CIC/SIC | within 90 days | s.19(3) |

**Approach.** Pure date arithmetic over `RequestContext` — no API, no model, no new
infrastructure. Self-contained and the easiest of the four to finish. It also demos in a single
screenshot, which matters.

---

### A3. More Indian languages

**What it does.** Beyond the current English and Hindi, toward Bengali, Marathi, Tamil and Telugu.

**The real cost is not translation.** `frontend/src/i18n.tsx` is a single 1,290-line file holding
two locales inline. Six locales in that shape is unmanageable and unreviewable. This needs a
split to one file per locale first, and that refactor is the actual work — the strings are the
easy half.

**Do this second-to-last.** It touches every string in the app, so anything landing after it has
to be written six times.

---

### A4. Offline / low-bandwidth PWA

**The problem it solves.** RTI's core users are disproportionately in places with bad
connectivity. A form that loses a half-written request on a dropped connection is a form they
do not come back to.

**What it does.** Installable, loads on a weak connection, and drafts survive going offline.

**Honest assessment.** Highest cost, least visible in a demo. **This is the one to cut if
anything slips.**

---

## Track B — Refinement backlog

From the 2 September audit. Every item was verified against the code; none are guesses. The fixes
for items 1-4 were written and then reverted, so all of it is still outstanding.

### B1. Invalid CSS — silently dropped rules

`hsl(var(--…))` wrapping `oklch` tokens is not valid CSS, so the whole declaration is discarded.

- `src/routes/stitch-shell.tsx:188` — the mobile drawer's gradient **and** its shadow. The drawer
  currently renders as a flat panel with no depth.
- `src/routes/SubmissionSuccessPages.tsx:106` — the dotted radial pattern.

`src/routes/HomePage.tsx:136` already does the same thing correctly, without the `hsl()` wrapper.
Verified fix: `color-mix(in oklab, var(--x) N%, transparent)`.

### B2. Utility classes that do nothing

Three classes are absent from the theme, so they are no-ops:

- `text-shadow` on the homepage hero `<h1>` — bare `text-shadow` is not a utility in Tailwind v4;
  the family is `text-shadow-*`.
- `text-on-primary-container` on the hero `<p>`. Note `--primary-container` is aliased to
  `var(--primary)`, so this was already inheriting the correct colour — the class just goes.
- `text-title-md` on the appeal success page. The identical heading on the request success page
  uses `text-xl`.

### B3. Dead code

`src/routes/ProfilePage.tsx:397-460` — 64 lines of commented-out history table duplicating
`RequestHistoryPage.tsx`. Verified self-contained: every identifier it references appears nowhere
else in the file, so deleting it strands nothing.

### B4. Untranslated strings that actually render

~20 of them, on a portal whose pitch leads with being bilingual:

- ProfilePage placeholders, the `India`/`Other` select, "No state found.", the closing privacy line
- `src/App.tsx` guidelines-acknowledgement gate, both journeys — the file imports no
  `useTranslation` at all
- 4 `HelpIcon` tooltips in `src/routes/FirstAppealFormPage.tsx`
- 3 `aria-label`s (activity overview, lifecycle flowchart, captcha)

**Two traps.** The gender / area / education radios *look* hardcoded but are not — `RadioChoices`
maps the values through `t()`. And `firstAppeal.helpRegistration` already exists meaning "Help
with registration number"; a new key must not reuse that name.

### B5. No automated tests

There is no test runner installed. CI is lint + the two eval scripts + build.

Highest-value first test: **en/hi translation key parity.** It would have caught every B4 bug, and
it becomes essential the moment A3 takes the app to six locales.

### B6. Smaller items

- `ministryNames` duplicated between `src/routes/PublicAuthoritiesPage.tsx:47` and
  `src/services/authority-recommendations.ts:24`
- Single 896 kB bundle, no code splitting — the build warns
- Five route files carry no ARIA: AppLayout, ContactUs, MockPayment, NotFound, SecondAppeal

---

## Sequence

| Day | Work |
|---|---|
| **3 Sep** | A1 AI drafting, then start A2 deadline tracker |
| **4 Sep** | Finish A2. Start A4 PWA, timeboxed |
| **5 Sep** | A3 languages — split `i18n.tsx` per-locale first, then translate |
| **6 Sep** | Track B: B1-B4, plus Vitest with the key-parity test (B5) |
| **7 Sep** | Deploy, verify, submit. Buffer |

**Scope call:** four features plus the backlog in five days is over-scoped. If something slips,
drop A4.

---

## Verification

Run from `frontend/` before any deploy:

```bash
npx tsc -b                 # clean
npm run lint               # 13 warnings, 0 errors — current baseline
npm run eval:authorities   # 77/77
npm run eval:privacy       # 52/52
npm run build              # clean
```

Deploys run from the git-free scratchpad copy, not the repo. Confirm the live bundle hash matches
the local `dist/assets/index-*.js` — that proves what is serving is what was verified.

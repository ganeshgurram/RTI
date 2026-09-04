# RTI Online — Phase 2 Plan

Selected into the **top 250 of Build What Moves India**. Phase 2 submissions **open** 7 September
2026 — a start date, not a deadline.

The deliverable is a **2-minute video**. Minute 1 covers the problem and the project in action.
Minute 2 covers **one** feature that genuinely differentiates the project — not a tour of the
build. Storytelling is graded explicitly, alongside the work.

So this plan is ordered by what a viewer can see and understand in 120 seconds.

## How this phase is prioritised

**Features and interface first. Performance is a scheduled pass at the end — last, but not
skipped.**

The code is already written tight as a matter of habit, so the remaining performance wins are
real but small, and they stay available. A missing feature on the day of recording does not. What
a reviewer actually notices in two minutes is a chatbot routing a question to the wrong tribunal,
a form that cannot be finished, or a screen that looks unfinished — all feature and interface
defects. The one exception: anything slow enough to be visible on camera stops being a
performance item and becomes an interface item that day.

## Already shipped ✅

Verified against the tree on 4 September, not carried over from the previous plan.

- **Statutory deadline tracker** — live on eight surfaces, hard-blocks premature appeals with the
  date the appeal opens, 71 assertions in CI.
- **Request detail page** — one request opens into its full record, including the request text.
- **First Appeal prefill** — an eligible request carries its own number and email into the appeal;
  a signed-in applicant skips the lookup but still passes the guidelines.
- **Review before submission** and **draft save and resume**.
- **Actionable notifications** and the **RTI lifecycle guide**.
- **AI rewrite assistance** — on both the request form and the appeal form. Half the original
  feature; see item 1.
- **Bilingual coverage** — 743 keys × 2 languages, parity enforced in CI by `check:i18n`.
- **Audit items B1–B3** and the duplicated `ministryNames` — all four verified absent.

## Priority 1 — Finish what is half-built

### 1. Answerability flags

**Experience:** When the AI rewrites a draft, it also flags what is unlikely to be answered:
opinions and hypotheticals, which are not "information" under s.2(f); records exempt under s.8;
and anything already in the public domain. The flags appear under the suggestion as advisory
notes, never as a block.

**Why it matters:** This is the half that changes outcomes. A beautifully worded request for
exempt information still fails — 30 days later, in a rejection that teaches the applicant nothing.
It is also the clearest eight seconds of video in the project: *"why was my claim rejected"*
flagged as an opinion, rewritten into *"provide the file notings recording the decision."*

**Current state:** Not built, and currently prevented. The drafting prompt
(`api/rti-sahayak.js:158`) ends with *"Do not include a title, commentary, Markdown fence,
warning, or a note to the applicant"* — the model is instructed to suppress exactly this.

**Done when:** Flags return as a separate field alongside the rewrite, so the rewritten text stays
clean enough to drop straight into the form; and an applicant can ignore every flag and still file.

### 2. Authority recommender accuracy

**Experience:** Typing a common acronym reaches the right authority. "EPF" reaches the provident
fund organisation, not the Railway Claims Tribunal.

**Why it matters:** The recommender is on screen in minute 2 whichever feature is chosen, and this
bug is reachable in about four seconds — there is a seeded request titled *"EPF withdrawal claim
rejection reasons"*.

**Current state:** `epf` is absent from the vocabulary; `authority-recommendations.ts:62` has only
`epfo`. The `pf` entry at line 88 is unreachable dead code, because the tokeniser drops anything
under three characters (lines 293, 473, 483).

**Done when:** `epf`, `uan` and `pension` resolve correctly; the dead `pf` entry is either revived
or removed rather than left looking live; the same sweep covers ESIC, NPS, PMAY, FASTag and ITR;
and `npm run eval:authorities` still passes 100%.

## Priority 2 — The differentiating feature ✅ Complete

### 3. Conversational RTI filing

**Experience:** The applicant describes their problem to RTI Sahayak in plain language. The
assistant identifies the department and public authority, drafts the request text, and hands both
to a confirmation screen where personal details are filled from the signed-in profile. The
applicant reviews everything before anything is submitted. BPL applicants skip payment.

**Why it matters:** The hardest part of filing is not the form — it is knowing which office holds
the information and how to phrase a question so it can be answered. This is the only candidate for
minute 2 that a reviewer has not already seen elsewhere, and it compresses into one sentence:
*describe your problem, confirm, filed.*

**The privacy shape, which is the point:** the assistant handles only the impersonal half —
authority, subject, request text. Personal details never enter the conversation; they come from
the profile, client-side. Worth saying out loud in the video, because "AI that files government
forms" otherwise sounds alarming.

**What stands in the way, verified:**

- The chat prompt (`api/rti-sahayak.js:99-110`) confines the assistant to informational answers and
  forbids decisions. Filing needs a **fourth task** on the endpoint — `chat`, `translate` and
  `rewrite` already coexist there — not a loosened chat prompt, which would weaken every answer.
- Chat history is capped at the **last 4 messages**, too short for a filing conversation.
- `containsSensitiveData` would fire on a normal account of a problem. The filing path needs its
  own rule: block identifiers, allow the narrative.

**Done when:** A citizen reaches a filled confirmation screen from a plain-language description
without typing an authority name, and nothing is ever submitted directly from the chat.

**Delivered:** `/file-with-sahayak` now accepts an impersonal plain-language description, finds
directory candidates, creates an editable subject and request draft, and shows a confirmation
screen. The normal guidelines → official form → review → BPL/payment journey remains mandatory.
Only the confirmation/form reads the local profile; it is never sent to the assistant. The API has
a separate `filing` task and the client keeps a conservative local fallback for demos.

**Fallback:** If this is not demonstrable by **5 September**, minute 2 becomes the statutory
deadline tracker, reframed as rights enforcement rather than date arithmetic. That costs nothing —
the tracker is finished.

## Priority 3 — Help people choose the right path before filing ✅ Complete

### 4. RTI Readiness Check

**Experience:** Four or five plain questions before filing begins — is this a Central public
authority, are you seeking existing records or an opinion, do you know the office, has a request
already been made.

**Result:** Routes to *ready to file*, *find an authority*, *file a First Appeal*, *use CIC / SIC*,
or *this looks like a grievance rather than an RTI*.

**Why it matters:** It prevents the most common wasted filing, and it strengthens minute 1 — "we
stop you filing the wrong thing" lands fast.

**Done when:** The check takes under two minutes, collects no personal data, and works in English
and Hindi.

**Delivered:** `/readiness-check` provides a five-question, bilingual, in-memory decision path to
RTI filing, authority search, First Appeal, Commission guidance, a grievance route, or status.
It is linked from the home hero and never stores an answer.

## Priority 4 — Build trust through the interface

### 5. First-visit orientation

**Experience:** A dismissible three-step introduction: find an authority, submit a request, track
progress.

**Why it matters:** It helps first-time applicants without adding clutter for returning ones, and
it gives minute 1 a natural opening shot.

**Done when:** It appears once, dismisses permanently, and never blocks the page.

### 6. Plain-language prototype and privacy notices

**Experience:** Clear statements of what is mock data, what stays on the device, what DigiLocker
simulation means, and what must never be typed into RTI Sahayak.

**Why it matters:** Stating the limits plainly reads as confidence. An honest demo is also a
grading criterion in its own right.

**Done when:** A viewer can tell what is real and what is simulated without narration.

### 7. Remaining untranslated strings

**Experience:** Switching to Hindi leaves no English behind.

**Current state:** Two confirmed. `App.tsx` renders both guidelines gates in hardcoded English and
imports no `useTranslation` at all. `RequestHistoryTable.tsx:109` hardcodes "Showing X–Y of N
requests" while `history.showingRange` already exists at `i18n.tsx:682` and goes unused.

**Done when:** Both are keyed and `check:i18n` still passes.

### 8. Accessibility gaps

**Experience:** Every route is navigable by keyboard and readable by a screen reader.

**Current state:** `AppLayout`, `ContactUs`, `MockPayment`, `NotFound` and `SecondAppeal` carry no
ARIA landmarks.

**Done when:** Each route has a labelled main region and the tab order is sane.

## Priority 5 — Reach more citizens

### 9. More Indian languages

**Experience:** Bengali, Marathi, Tamil and Telugu alongside English and Hindi.

**Why it matters:** It is the clearest statement that the portal is built for the country rather
than for a demo. On camera it is one dropdown, so it earns its place through credibility, not
spectacle.

**The real cost is the file, not the strings:** `i18n.tsx` is a single 1,622-line file holding two
locales inline. Six locales in that shape is unreviewable, so this needs a split to one file per
locale first, and `check:i18n` extended to enforce parity across all six.

**Do this after the feature freeze** — it touches every string, so anything landing after it has
to be written six times. It is also the first thing to drop if the window is short.

## Deferred — offline / low-bandwidth PWA

Still the right feature for the real users, and still the most expensive and least visible one.
A video cannot show a service worker. Recorded here so the reasoning is not rediscovered later.

## Presentation priorities

For the two-minute video, in order:

1. **Minute 1** — the problem, then the journey: home page → readiness check → authority search →
   compact RTI form with profile prefill → BPL or payment → registration number → history with
   live statutory deadlines.
2. **Minute 2** — conversational filing end to end, on one real example, ending at the confirmation
   screen. Name the privacy division out loud.

`DEMO_SCRIPT.md` is written to the previous brief — its second minute is a build walkthrough,
which is exactly what this round asks us not to do. Rewrite it once minute 2 is settled.

## Supporting quality work — after the feature pass

Half a day, after the freeze and before recording. Nothing here is ignored; it is sequenced.

- **Route-level code splitting.** One ~896 kB bundle, and the build warns. The largest and simplest
  win, and the one item here that could become visible on camera.
- **The Material Symbols icon font** — ~1.1 MB from Google on every page load for 69 icons used,
  across three serial round trips, and it breaks offline.
- **Error and recovery states** for directory loading and a failed AI call.
- **A test runner.** Still absent; CI is lint, four eval suites and build. `check:i18n` covers the
  highest-value case, so this only becomes urgent if item 9 lands.
- **Two small hygiene items.** `components/RequestDetailDialog.tsx` is orphaned — 117 lines
  imported by nothing, superseded by `routes/RequestDetailPage.tsx`; delete it. And the rewrite
  path deliberately skips `containsSensitiveData` (it returns at `:525`, before the check at
  `:544`) because an RTI request legitimately contains the applicant's own file numbers and dates —
  that reasoning needs a comment, or someone will "fix" the inconsistency and break the form.

## Sequence

Submissions open 7 September. The **closing date is not yet known** — worth confirming, since it
decides whether item 9 is realistic.

| Day | Work |
|---|---|
| **4 Sep** | Items 1 and 2 — answerability flags and the recommender fix. |
| **5 Sep** | Item 3 spike, then **decide minute 2**. Continue or take the fallback. |
| **6 Sep** | Item 4, then Priority 4 in full. Feature freeze at the end of the day. |
| **7 Sep** | Supporting quality pass. Rewrite `DEMO_SCRIPT.md`. Deploy and verify. |
| **After** | Item 9 if the window allows. Record and submit. |

**Scope call:** items 1–4 plus Priority 4 is the honest ceiling before a freeze. Item 9 is the one
to drop, and dropping it costs a dropdown, not a story.

## Verification

Run from `frontend/` before any deploy. All seven pass as of 4 September:

```bash
npx tsc -b                 # clean
npm run lint               # 13 warnings, 0 errors
npm run check:i18n         # 743 keys x 2 languages, 539 call sites resolved
npm run eval:authorities   # 77/77
npm run eval:privacy       # 52/52
npm run eval:deadlines     # 71/71
npm run build              # clean
```

Deploys go to Vercel — the site and the `/api` function in one project, one key, one origin.
Confirm the live bundle hash matches the local `dist/assets/index-*.js`, which proves what is
serving is what was verified.

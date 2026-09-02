# RTI Online — Feature & Refinement Plan

This backlog is for turning the current hackathon prototype into a polished, trustworthy demo. Work is ordered by user value and presentation impact rather than by implementation effort.

## Guiding principles

- Keep all applicant data mock-only until a secure backend exists.
- Make every new journey work in English and Hindi, on mobile and desktop.
- Prefer clear guidance and progressive disclosure over adding visual complexity.
- Never portray the prototype as an official government service.

## Priority 1 — Reliability, performance, and accessibility

### 1. Route-level loading and smaller first load

**Why:** The current production JavaScript bundle is about 898 kB before compression. Secondary journeys should not slow down a visitor who only needs the home page or status lookup.

**Scope:**

- Load secondary routes on demand: profile, request history, public authorities, FAQs, payments, appeals, and success pages.
- Defer the RTI Sahayak panel until the visitor opens it.
- Add a consistent inline loading state for deferred pages.

**Done when:** The initial bundle is materially smaller and every direct URL still loads correctly on Vercel.

### 2. Route error and recovery states

**Why:** A failed dynamic import, malformed mock storage value, or unavailable directory should never leave a blank page.

**Scope:**

- Add a friendly application-level error boundary with Reload and Back to Home actions.
- Keep the existing Public Authorities load error, but add retry behavior.
- Fix the two React effect-dependency warnings around the request-guidelines gate.

**Done when:** A controlled failure produces a readable recovery screen rather than an empty viewport.

### 3. Accessibility completion pass

**Scope:**

- Update the document `lang` attribute when the portal language changes.
- Add a keyboard-visible skip-to-content link.
- Review focus movement in dialogs, dropdowns, notifications, and the mobile drawer.
- Respect `prefers-reduced-motion` for animations.
- Perform a manual mobile, keyboard, and screen-reader smoke test before demo day.

**Done when:** Primary journeys can be completed without a mouse and language-aware assistive technology receives the correct document language.

## Priority 2 — Better application journeys

### 4. Save and resume drafts

**Why:** RTI and appeal forms can be long. Losing a partially written request is a major trust failure.

**Scope:**

- Save a local draft automatically while the applicant types.
- Resume a draft after reload, with a clear “Discard draft” option.
- Keep RTI request and First Appeal drafts separate.
- Show the last-saved time and clearly state that drafts stay only on the current device in this prototype.

**Done when:** A visitor can leave a partially completed form, return, and continue without re-entering information.

### 5. Review before submit

**Scope:**

- Add a final review screen before mock payment or submission.
- Summarize authority, applicant contact details, BPL/fee status, subject, and request text.
- Let the applicant jump back to the exact section needing correction.
- Preserve the current guidelines acknowledgement and payment behavior.

**Done when:** The applicant can confirm the complete submission before generating a registration number.

### 6. Request timeline and clearer status language

**Scope:**

- Show a visual timeline in request details/history: submitted, payment verified, assigned, CPIO response, appeal eligibility.
- Explain what each mock status means and what the applicant can do next.
- Keep statuses visibly distinct without relying only on colour.

**Done when:** A first-time visitor understands the next step for every status at a glance.

## Priority 3 — High-impact new features

### 7. RTI Readiness Check (recommended next new feature)

**Goal:** Help people decide whether and how to file before they begin a lengthy form.

**Experience:**

1. Ask 4–5 plain-language questions: Is it about a Central Government public authority? Are they seeking existing information or asking for action? Do they know the authority? Is there a prior request/appeal?
2. Return a clear result: ready to file, choose an authority first, use First Appeal, or this portal may not be the right channel.
3. Suggest matching public authorities using the existing recommendation service.
4. Offer the right next action without collecting personal data.

**Guardrails:**

- Present guidance, not legal advice or a legal eligibility decision.
- Clearly direct State Government matters and grievances to the appropriate channel.
- Support English and Hindi from the first release.

**Done when:** A visitor can reach the right portal journey in under two minutes without exposing personal data.

### 8. News and updates area (deferred)

**Goal:** Give every visitor one important, current update at first glance.

**Preferred design:**

- Use a site-wide announcement strip beneath the navigation instead of an auto-scrolling marquee.
- Display a “New” label, one short update, date, and optional link.
- Keep it readable on mobile and available to screen readers.
- Allow a future CMS/API to supply updates; use clearly marked mock updates until then.

**Avoid:** Continuous moving text that cannot be paused, or an alert banner that overwhelms the main content.

### 9. Demo mode and reset journey

**Scope:**

- Add a small, clearly labelled demo helper for judges.
- Explain the available mock accounts, DigiLocker simulation, mock payment outcomes, and public status lookup.
- Offer a reset action that clears local prototype state after confirmation.

**Done when:** A judge can experience the end-to-end story reliably from a fresh browser session.

## Priority 4 — Confidence and presentation

### 10. Guided first-visit onboarding

- Offer a dismissible three-step introduction: find authority, submit request, track progress.
- Show it only on the first visit and never block core actions.

### 11. Sharper evidence in the authority directory

- Show why a result was suggested (matched term, ministry, or related office).
- Add small, plain-language examples for common topics.
- Track zero-result search terms locally during demos to improve the vocabulary map.

### 12. Presentation-ready quality gate

- Add a concise manual QA checklist for desktop, mobile, English, Hindi, logged-out, logged-in, BPL, non-BPL, payment failure, First Appeal, and status lookup.
- Run build, lint, authority-recommendation evaluation, and privacy-filter evaluation before every demo or release.
- Add lightweight end-to-end tests for the two most important paths once a browser test environment is available.

## Suggested implementation order

1. Route-level loading and route recovery.
2. Save and resume drafts.
3. Review before submit and request timeline.
4. RTI Readiness Check.
5. Accessibility pass and demo mode.
6. News and updates area once there is real content to publish.

# RTI Online — Product & Interface Feature Roadmap

This roadmap prioritizes what a citizen, mentor, or judge can immediately understand and experience. The goal is a portal that makes filing and tracking an RTI feel clear, guided, and trustworthy — not merely a collection of forms.

## Current product story

RTI Online already demonstrates a complete prototype journey:

1. Discover the right public authority.
2. Read and acknowledge filing guidelines.
3. File an RTI request with profile-prefilled details, BPL handling, mock payment, and AI writing assistance.
4. Receive a registration number and track the request from the dashboard or public status lookup.
5. Understand statutory deadlines and move into a First Appeal when appropriate.
6. Use Hindi, DigiLocker simulation, notifications, and RTI Sahayak for support.

## Priority 1 — Make filing feel safe and complete ✅ Complete

### 1. Review before submission ✅

**Experience:** Before payment or submission, show a clean review screen with the selected authority, applicant contact details, BPL / fee decision, attachments, and request text.

**Why it matters:** Users gain confidence that the right details are being sent and can correct one section without starting again.

**Done when:** A user can inspect the whole application and jump back to any field before a registration number is generated.

### 2. Save and resume drafts ✅

**Experience:** Automatically preserve a partially written RTI request or First Appeal on the current device. Show a modest “Saved just now” message and a clear discard option.

**Why it matters:** A long request should never be lost because a user reloads the page or needs to pause.

**Done when:** Each form restores its own draft after a reload without mixing RTI and appeal data.

### 3. Smarter form guidance ✅

**Experience:** Add short, plain-language guidance beside difficult fields: choosing an authority, writing a focused information request, BPL proof, and appeal grounds.

**Why it matters:** It reduces hesitation without turning the form into a dense instruction manual.

**Done when:** Help appears only where needed, works on mobile, and never blocks form completion.

## Priority 2 — Make request tracking understandable ✅ Complete

### 4. Actionable notifications ✅

**Experience:** Expand notifications beyond read/unread state: each item should say what changed and offer one relevant action, such as “View response,” “Pay fee,” or “File First Appeal.”

**Why it matters:** The dashboard becomes a useful guide instead of a passive list of updates.

**Done when:** A user can act on an important update directly from the notification centre.

### 5. Request detail hub ✅

**Experience:** Let a request open into a focused detail view containing its current status, submitted text, authority, documents, payment state, and next steps.

**Why it matters:** Users should not need to hunt across history, status, and appeal pages to understand one application.

**Done when:** One request detail view answers “what did I submit, where is it, and what should I do next?”

## Priority 3 — Help people choose the right path before filing

### 6. RTI Readiness Check

**Experience:** Ask four or five plain-language questions before a user begins: whether the matter concerns a Central Public Authority, whether they seek existing information, whether they know the authority, and whether a prior request exists.

**Result:** Direct the user to “Ready to file,” “Find an authority,” “File a First Appeal,” “Use CIC / SIC,” or “This may be a grievance rather than an RTI.”

**Why it matters:** It prevents users from spending time in the wrong journey and demonstrates thoughtful product design.

**Done when:** The decision takes under two minutes, collects no personal data, and works in English and Hindi.

### 7. Guided authority finder

**Experience:** Build on the Public Authorities Directory with a conversational topic search: “passport delay,” “railway refund,” or “pension records” should explain why an authority is suggested and offer a direct File RTI action.

**Why it matters:** Knowing the right authority is often the hardest part of filing.

**Done when:** Results explain their match in plain language and always allow the user to verify or change the authority.

### 8. Better First Appeal preparation

**Experience:** When an appeal becomes eligible, prefill the original request context, explain the relevant ground, and provide a short checklist of documents before the form begins.

**Why it matters:** Appeals are high-stakes and should feel guided, not like a separate unfamiliar form.

**Done when:** An applicant can move from an eligible request to a prepared First Appeal without re-entering known information.

## Priority 4 — Build trust through the interface

### 9. Plain-language privacy and prototype notices

**Experience:** Clearly explain what is mock data, what stays on the device, what DigiLocker simulation means, and what information should never be entered into RTI Sahayak.

**Why it matters:** Trust is part of the product, especially for a portal handling personal contact information.

### 10. First-visit guidance

**Experience:** Offer a dismissible, three-step orientation: find an authority, submit a request, track progress.

**Why it matters:** It helps first-time applicants understand the portal without adding clutter for returning users.

### 11. News and service updates

**Experience:** Add one accessible announcement area beneath the navigation for important RTI updates, maintenance notices, or guidance changes.

**Design rule:** Use a static, readable announcement strip — not an auto-scrolling marquee.

## Presentation priorities

For a two-minute walkthrough, show these visible features in order:

1. Home page and the problem being solved.
2. Guidelines → authority search → compact RTI form.
3. AI rewrite assistance and BPL / payment decision.
4. Submission success → request history → deadlines and First Appeal path.

## Supporting quality work — after the feature pass

These remain important, but should support the product story rather than lead it:

- Route-level code splitting and smaller initial load.
- Error recovery states and robust directory loading.
- Keyboard, screen-reader, contrast, and language accessibility checks.
- Demo reset mode and a full end-to-end QA checklist.
- Lightweight automated tests for request, payment, status, and appeal journeys.

/**
 * Evaluates the statutory deadline arithmetic against the RTI Act's timelines.
 *
 *   npm run eval:deadlines
 *
 * Every case passes or the run fails. There is no partial credit here, unlike the recommender:
 * a wrong deadline tells an applicant they have lost a right they still hold, or that they hold
 * one they have lost, and either is worse than showing nothing at all.
 *
 * The numbers and citations are the reason this file exists. They were verified against the bare
 * Act, and a typo in one of them is silent - it renders as a perfectly plausible date. Group C
 * exists so that a typo fails here instead.
 */
const {
  addDays,
  canFileFirstAppeal,
  formatRequestDate,
  getRequestDeadline,
  parseRequestDate,
  statutoryLimits,
} = await import(new URL("../src/services/statutory-deadlines.ts", import.meta.url).href)

const { digiLockerMockRequests, mockRequests } = await import(
  new URL("../src/data/mock-profile.ts", import.meta.url).href
)

const failures = []
let passed = 0
let total = 0

function check(label, ok, detail) {
  total += 1
  if (ok) {
    passed += 1
  } else {
    failures.push({ detail, label })
  }
}

const iso = (date) =>
  date === null
    ? null
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

// --- A. Format and parse are exact inverses -------------------------------------------------
// The whole design rests on this. Requests carry no machine-readable date, only the display
// string, so the tracker parses what the portal printed. If the two ever disagree the clock reads
// a date nobody wrote. Four years of days is cheap and covers every month length and both leap
// years, which no hand-written list would.
let roundTripFailure = null
let roundTripDays = 0

for (let day = new Date(2025, 0, 1); day < new Date(2029, 0, 1); day = addDays({ date: day, days: 1 })) {
  const back = parseRequestDate(formatRequestDate(day))
  roundTripDays += 1

  if (!back || back.getTime() !== day.getTime()) {
    roundTripFailure = `${iso(day)} formatted as "${formatRequestDate(day)}" parsed back as ${iso(back)}`
    break
  }
}

check(`format/parse round trip over ${roundTripDays} days`, !roundTripFailure, roundTripFailure)

// --- B. The parser ---------------------------------------------------------------------------
/** [input, the calendar day it must yield, or null when it must not parse at all] */
const parserCases = [
  // the shape every fixture and the formatter use
  ["12 Aug 2026", "2026-08-12"],
  ["01 Jan 2026", "2026-01-01"],
  ["31 Dec 2025", "2025-12-31"],
  ["29 Feb 2028", "2028-02-29"],
  // "Sept" is what Intl produced before the formatter was replaced, and stored requests still hold it
  ["03 Sept 2026", "2026-09-03"],
  ["03 September 2026", "2026-09-03"],
  ["03 Sep 2026", "2026-09-03"],
  // tolerated noise
  ["3 Sep 2026", "2026-09-03"],
  ["03 SEP 2026", "2026-09-03"],
  ["  12 Aug 2026  ", "2026-08-12"],
  // a string this cannot read has to make the clock invisible, never wrong
  ["29 Feb 2026", null],
  ["31 Apr 2026", null],
  ["32 Aug 2026", null],
  ["00 Aug 2026", null],
  ["12 Foo 2026", null],
  ["2026-08-12", null],
  ["12 Aug", null],
  ["", null],
  ["Closed", null],
  ["Reply due 11 Sep 2026", null],
]

for (const [input, expected] of parserCases) {
  const got = iso(parseRequestDate(input))
  check(`parse "${input}"`, got === expected, `expected ${expected}, got ${got}`)
}

// --- C. The limits and their citations --------------------------------------------------------
/** [key, days, section] - verified against the bare Act; a typo here is invisible in the UI */
const limitCases = [
  ["pioReply", 30, "7(1)"],
  ["apioReply", 35, "5(2)"],
  ["thirdParty", 40, "11(3)"],
  ["lifeOrLiberty", 2, "7(1) proviso"],
  ["appealWindow", 30, "19(1)"],
  ["faaDecision", 30, "19(6)"],
  ["faaExtended", 45, "19(6)"],
  ["secondAppeal", 90, "19(3)"],
]

for (const [key, days, section] of limitCases) {
  const limit = statutoryLimits[key]
  check(
    `limit ${key}`,
    limit && limit.days === days && limit.section === section,
    `expected ${days} days / s.${section}, got ${limit ? `${limit.days} days / s.${limit.section}` : "missing"}`,
  )
}

// The 48-hour proviso is stored as two days so it can be compared with the rest, and must never
// reach a reader in that form.
check("lifeOrLiberty reads as hours", statutoryLimits.lifeOrLiberty.label === "48 hours", `got "${statutoryLimits.lifeOrLiberty.label}"`)

// --- D. Which clock a request is running ------------------------------------------------------
/** [status, submittedOn, lastUpdated, today, kind or null, daysRemaining, tone] */
const deadlineCases = [
  // the PIO's own limit - the authority is in default when it runs out, so it turns red
  ["Processing", "12 Aug 2026", "18 Aug 2026", "03 Sep 2026", "pioReply", 8, "info"],
  ["Processing", "12 Aug 2026", "18 Aug 2026", "05 Sep 2026", "pioReply", 6, "warning"],
  ["Processing", "12 Aug 2026", "18 Aug 2026", "11 Sep 2026", "pioReply", 0, "warning"],
  ["Processing", "12 Aug 2026", "18 Aug 2026", "12 Sep 2026", "pioReply", -1, "error"],
  ["Pending Verification", "03 Sep 2026", "03 Sep 2026", "03 Sep 2026", "pioReply", 30, "info"],
  // month lengths, a year rollover and a leap February, through the mapping rather than the parser
  ["Processing", "31 Jan 2026", "31 Jan 2026", "03 Mar 2026", "pioReply", -1, "error"],
  ["Processing", "15 Dec 2025", "15 Dec 2025", "10 Jan 2026", "pioReply", 4, "warning"],
  ["Processing", "30 Jan 2028", "30 Jan 2028", "01 Mar 2028", "pioReply", -1, "error"],
  // the applicant's own filing window - closing it is not a default, so it never turns red
  ["Reply received", "09 Aug 2026", "24 Aug 2026", "03 Sep 2026", "appealWindow", 20, "info"],
  ["Reply received", "01 Jul 2026", "14 Jul 2026", "03 Sep 2026", "appealWindow", -21, "neutral"],
  ["Reply received", "22 Jul 2025", "12 Aug 2025", "03 Sep 2026", "appealWindow", -357, "neutral"],
  // s.19(6): thirty days, then the extension the authority must record reasons for, then a lapse
  ["First Appeal", "27 Jul 2026", "18 Aug 2026", "03 Sep 2026", "faaDecision", 14, "info"],
  ["First Appeal", "17 Jun 2026", "20 Jul 2026", "14 Aug 2026", "faaDecision", 5, "warning"],
  ["First Appeal", "17 Jun 2026", "20 Jul 2026", "03 Sep 2026", "faaExtended", 0, "warning"],
  ["First Appeal Filed", "17 Jun 2026", "20 Jul 2026", "10 Sep 2026", "faaExtended", -7, "error"],
  // statuses that carry no clock at all
  ["Satisfied", "03 Jul 2026", "02 Aug 2026", "03 Sep 2026", null, null, null],
  ["Second Appeal", "08 Apr 2026", "13 May 2026", "03 Sep 2026", null, null, null],
  ["Something Else", "08 Apr 2026", "13 May 2026", "03 Sep 2026", null, null, null],
  // an unreadable anchor must yield no clock rather than a wrong one
  ["Processing", "not a date", "18 Aug 2026", "03 Sep 2026", null, null, null],
]

for (const [status, submittedOn, lastUpdated, today, kind, daysRemaining, tone] of deadlineCases) {
  const deadline = getRequestDeadline({
    request: { lastUpdated, status, submittedOn },
    today: parseRequestDate(today),
  })

  const got = deadline ? `${deadline.kind} ${deadline.daysRemaining} ${deadline.tone}` : "null"
  const want = kind === null ? "null" : `${kind} ${daysRemaining} ${tone}`

  check(`${status} filed ${submittedOn}, on ${today}`, got === want, `expected ${want}, got ${got}`)
}

// --- E. Whether a first appeal may be filed ---------------------------------------------------
/** [registration number, status, submittedOn, lastUpdated, today, allowed, reason] */
const gateCases = [
  // silence has to be waited out, and the thirtieth day is still in time
  ["RTI-2026-11842", "Processing", "12 Aug 2026", "18 Aug 2026", "03 Sep 2026", false, "waiting"],
  ["RTI-2026-11842", "Processing", "12 Aug 2026", "18 Aug 2026", "11 Sep 2026", false, "waiting"],
  ["RTI-2026-11842", "Processing", "12 Aug 2026", "18 Aug 2026", "12 Sep 2026", true, "lapsed"],
  ["RTI-2026-99999", "Pending Verification", "03 Sep 2026", "03 Sep 2026", "03 Sep 2026", false, "waiting"],
  // s.19(1) also gives an appeal to anyone "aggrieved by a decision", so a reply unlocks it at once
  ["RTI-2026-08604", "Reply received", "24 May 2026", "30 Jun 2026", "03 Sep 2026", true, "decisionReceived"],
  // and a closed window must not bar it either - the s.19(1) proviso allows a late appeal for cause
  ["RTI-2025-14820", "Reply received", "22 Jul 2025", "12 Aug 2025", "03 Sep 2026", true, "decisionReceived"],
  // an appeal already exists, so the next step is the Information Commission, not another first appeal
  ["RTI-2026-09751", "First Appeal", "17 Jun 2026", "20 Jul 2026", "03 Sep 2026", false, "alreadyAppealed"],
  ["RTI-2026-07118", "Second Appeal", "08 Apr 2026", "13 May 2026", "03 Sep 2026", false, "alreadyAppealed"],
  // appeals sit in the same list as requests, so the lookup can find one - it must not accept it
  ["RTI-A-2026-118420", "First Appeal Filed", "03 Sep 2026", "03 Sep 2026", "03 Sep 2026", false, "appealRow"],
  // an unreadable date must not trap the applicant behind a gate that cannot explain itself
  ["RTI-2026-00001", "Processing", "not a date", "18 Aug 2026", "03 Sep 2026", true, "noClock"],
]

for (const [requestId, status, submittedOn, lastUpdated, today, allowed, reason] of gateCases) {
  const eligibility = canFileFirstAppeal({
    request: { lastUpdated, status, submittedOn },
    requestId,
    today: parseRequestDate(today),
  })

  const got = `${eligibility.allowed} ${eligibility.reason}`
  const want = `${allowed} ${reason}`

  check(`gate ${requestId} (${status}) on ${today}`, got === want, `expected ${want}, got ${got}`)
}

// The blocked path has to name the day the appeal opens, which is the day after the last lawful
// day to reply - an off-by-one here sends the applicant back a day early.
const waiting = canFileFirstAppeal({
  request: { lastUpdated: "18 Aug 2026", status: "Processing", submittedOn: "12 Aug 2026" },
  requestId: "RTI-2026-11842",
  today: parseRequestDate("03 Sep 2026"),
})

check("blocked appeal names the day it unlocks", waiting.unlocksOn === "12 Sep 2026", `got ${waiting.unlocksOn}`)
check("blocked appeal reports days remaining", waiting.daysRemaining === 8, `got ${waiting.daysRemaining}`)

// --- F. The seeded history agrees with the arithmetic -----------------------------------------
// Every "Reply due 11 Sep 2026" in the fixtures is a second copy of a date this module computes,
// and four of them had drifted before this check existed. A row that says one thing while the chip
// beside it says another is worse than either alone, so a future fixture edit fails here.
for (const request of [...mockRequests, ...digiLockerMockRequests]) {
  const stated = /(\d{1,2} [A-Za-z]+ \d{4})/.exec(request.nextAction)
  if (!stated) continue

  // "Reply due" counts from filing; "Action needed by" counts from the last movement on the appeal.
  const anchor = parseRequestDate(request.nextAction.startsWith("Reply due") ? request.submittedOn : request.lastUpdated)
  const expected = anchor && formatRequestDate(addDays({ date: anchor, days: 30 }))

  check(`fixture ${request.id} prose matches its clock`, expected === stated[1], `prose says ${stated[1]}, arithmetic gives ${expected}`)
}

// A stale seed would quietly remove the one thing this feature exists to show, so the demo data is
// asserted to still cover a running clock, one about to expire and one already lapsed.
const today = new Date()
const tones = new Set(
  [...mockRequests, ...digiLockerMockRequests]
    .map((request) => getRequestDeadline({ request, today })?.tone)
    .filter(Boolean),
)

for (const tone of ["error", "info", "warning"]) {
  check(`seeded history still shows a "${tone}" deadline today`, tones.has(tone), `tones present: ${[...tones].sort().join(", ")}`)
}

console.log(`\n${passed}/${total} passed (${Math.round((passed / total) * 100)}%)\n`)

for (const { detail, label } of failures) {
  console.log(`  ${label}`)
  console.log(`    ${detail}\n`)
}

process.exit(failures.length ? 1 : 0)

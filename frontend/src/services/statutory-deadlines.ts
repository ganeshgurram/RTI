/**
 * The RTI Act's clocks, as arithmetic.
 *
 * The Act's timelines are the applicant's only real leverage, and a lapse converts into concrete
 * rights: information free of charge, a deemed refusal to appeal against, an appeal that becomes
 * available. This module turns the two dates a request carries into those entitlements.
 *
 * Everything here is pure and takes `today` as an argument. Nothing calls `new Date()`, so the
 * eval script can freeze the clock, and a component can compute a row's deadline inside a `.map()`
 * without reaching for a hook.
 *
 * This module deliberately imports nothing - not even `RtiRequest`. Importing it would create a
 * cycle through `mock-profile`, and would drag React into `scripts/eval-deadlines.mjs`, which
 * loads this file directly through Node's type stripping.
 */

export type StatutoryLimit = {
  days: number
  /** How the limit reads in the Act. The 48-hour proviso must never be shown to anyone as "2 days". */
  label: string
  section: string
}

/** Only the fields the arithmetic needs, so `RtiRequest` satisfies it structurally. */
export type DeadlineRequest = {
  lastUpdated: string
  status: string
  submittedOn: string
}

export type DeadlineKind = "appealWindow" | "faaDecision" | "faaExtended" | "pioReply"

/**
 * Whose clock ran out. Tone follows this rather than the sign of `daysRemaining`: an authority in
 * default is an error the applicant can act on, while an applicant past their own filing window is
 * not being accused of anything - and under the s.19(1) proviso can still be let in for cause.
 */
export type DeadlineOwner = "applicant" | "authority"

export type DeadlineTone = "error" | "info" | "neutral" | "warning"

export type RequestDeadline = {
  /** 0 means the deadline falls today, which is still in time. Negative means it has passed. */
  daysRemaining: number
  dueOn: string
  hasLapsed: boolean
  kind: DeadlineKind
  owner: DeadlineOwner
  section: string
  tone: DeadlineTone
}

export type FirstAppealReason = "appealRow" | "alreadyAppealed" | "decisionReceived" | "lapsed" | "noClock" | "waiting"

export type FirstAppealEligibility = {
  allowed: boolean
  /** Only set when the appeal is being held back for time; null otherwise. */
  daysRemaining: number | null
  reason: FirstAppealReason
  /** Only set alongside `daysRemaining`: the first day an appeal may be filed. */
  unlocksOn: string | null
}

/** Days at which a running clock starts being shown as at risk. A week is the unit people plan in. */
export const DUE_SOON_DAYS = 7

const MILLISECONDS_PER_DAY = 86_400_000

/**
 * The single month table. `RequestContext` formats through this rather than `Intl`, which renders
 * September as "Sept" on current ICU while every seeded fixture uses three letters - so a request
 * filed in September used to disagree with the rest of the portal. Sharing one table makes
 * `formatRequestDate` and `parseRequestDate` exact inverses, which the eval asserts day by day.
 */
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/**
 * Every limit the Act sets, with its citation. Only `pioReply`, `appealWindow` and the two
 * appellate stages can be computed: nothing in a request records whether it was filed through an
 * Assistant PIO, involves a third party, or concerns life and liberty. The rest are carried so the
 * portal can show what else the Act provides, and so the eval can catch a mistyped number.
 */
export const statutoryLimits = {
  appealWindow: { days: 30, label: "30 days", section: "19(1)" },
  apioReply: { days: 35, label: "35 days", section: "5(2)" },
  faaDecision: { days: 30, label: "30 days", section: "19(6)" },
  faaExtended: { days: 45, label: "45 days", section: "19(6)" },
  lifeOrLiberty: { days: 2, label: "48 hours", section: "7(1) proviso" },
  pioReply: { days: 30, label: "30 days", section: "7(1)" },
  secondAppeal: { days: 90, label: "90 days", section: "19(3)" },
  thirdParty: { days: 40, label: "40 days", section: "11(3)" },
} satisfies Record<string, StatutoryLimit>

/**
 * A date's calendar day, as UTC midnight. Local fields are read on the way in because the
 * applicant's "today" is the one on their wall clock, not the one in Greenwich; pinning both
 * operands to UTC then makes a subtraction an exact count of days, with no daylight-saving step.
 */
function toUtcDay(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
}

/**
 * `"12 Aug 2026"` to a date, or null for anything that does not parse. Never throws and never
 * returns an invalid date: a string this cannot read has to make the clock invisible, never wrong.
 *
 * Month matching is by three-letter prefix, so "Sep", "Sept" and "September" all resolve - stored
 * requests written before the formatter was replaced still hold the "Sept" that `Intl` produced.
 */
export function parseRequestDate(value: string): Date | null {
  const match = /^(\d{1,2}) ([A-Za-z]+) (\d{4})$/.exec(value.trim())

  if (!match) return null

  const day = Number(match[1])
  const year = Number(match[3])
  const token = match[2].toLowerCase()
  const month = monthNames.findIndex((name) => token.startsWith(name.toLowerCase()))

  if (month < 0) return null

  // Local midnight, not UTC: formatRequestDate reads local fields, and a portal opened west of
  // Greenwich would otherwise format a UTC-midnight date as the day before.
  const parsed = new Date(year, month, day)

  // The Date constructor rolls 31 April forward into May rather than rejecting it, so the only way
  // to know the day existed is to read it back.
  return parsed.getDate() === day && parsed.getMonth() === month ? parsed : null
}

/** The inverse of parseRequestDate, and the portal's one date format. */
export function formatRequestDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0")

  return `${day} ${monthNames[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * Calendar arithmetic rather than adding milliseconds: 30 days across a daylight-saving boundary
 * is still 30 days, and the constructor rolls day 45 of a month over on its own.
 */
export function addDays({ date, days }: { date: Date; days: number }) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/** Whole calendar days from one date to the other. Negative when `to` is in the past. */
export function daysBetween({ from, to }: { from: Date; to: Date }) {
  return Math.round((toUtcDay(to).getTime() - toUtcDay(from).getTime()) / MILLISECONDS_PER_DAY)
}

const pioStatuses = new Set(["Pending Verification", "Processing"])
const appellateStatuses = new Set(["First Appeal", "First Appeal Filed"])

function toneFor({ daysRemaining, owner }: { daysRemaining: number; owner: DeadlineOwner }): DeadlineTone {
  if (daysRemaining < 0) {
    // A missed reply is the authority's default and the applicant's opening. A closed filing window
    // is neither: s.19(1)'s proviso lets the appellate authority admit a late appeal for sufficient
    // cause, so colouring it red would both accuse the applicant and overstate the consequence.
    return owner === "authority" ? "error" : "neutral"
  }

  return daysRemaining <= DUE_SOON_DAYS ? "warning" : "info"
}

/**
 * The clock a request is currently running, or null when its status carries none.
 *
 * Status is the only signal available - nothing records the date a decision was communicated - so
 * `lastUpdated` stands in for it on the appeal and appellate clocks. That is an approximation, and
 * the reason a closed appeal window is advisory here rather than a bar.
 */
export function getRequestDeadline({ request, today }: { request: DeadlineRequest; today: Date }): RequestDeadline | null {
  const build = ({ anchor, kind, limit, owner }: { anchor: Date; kind: DeadlineKind; limit: StatutoryLimit; owner: DeadlineOwner }) => {
    const dueOn = addDays({ date: anchor, days: limit.days })
    const daysRemaining = daysBetween({ from: today, to: dueOn })

    return {
      daysRemaining,
      dueOn: formatRequestDate(dueOn),
      hasLapsed: daysRemaining < 0,
      kind,
      owner,
      section: limit.section,
      tone: toneFor({ daysRemaining, owner }),
    }
  }

  if (pioStatuses.has(request.status)) {
    const anchor = parseRequestDate(request.submittedOn)

    return anchor ? build({ anchor, kind: "pioReply", limit: statutoryLimits.pioReply, owner: "authority" }) : null
  }

  if (request.status === "Reply received") {
    const anchor = parseRequestDate(request.lastUpdated)

    return anchor ? build({ anchor, kind: "appealWindow", limit: statutoryLimits.appealWindow, owner: "applicant" }) : null
  }

  if (appellateStatuses.has(request.status)) {
    const anchor = parseRequestDate(request.lastUpdated)

    if (!anchor) return null

    // s.19(6) is thirty days, extendable to a total of forty-five but only for reasons recorded in
    // writing. Showing 45 from the start would hand the authority a fortnight it has not yet
    // earned, so the clock runs to 30 first and only then moves to the outer limit.
    const decision = build({ anchor, kind: "faaDecision", limit: statutoryLimits.faaDecision, owner: "authority" })

    if (!decision.hasLapsed) return decision

    const extended = build({ anchor, kind: "faaExtended", limit: statutoryLimits.faaExtended, owner: "authority" })

    return extended.hasLapsed ? extended : { ...extended, tone: "warning" }
  }

  return null
}

/**
 * How many of these requests a public authority is late on. Deliberately not "every clock that has
 * run out": an applicant past their own filing window is not owed anything, and counting them
 * would turn a history of old requests into a wall of alarm. Shared so the two screens that show
 * this tile cannot drift apart.
 */
export function countOverdueDeadlines({ requests, today }: { requests: DeadlineRequest[]; today: Date }) {
  return requests.filter((request) => {
    const deadline = getRequestDeadline({ request, today })

    return deadline?.hasLapsed && deadline.owner === "authority"
  }).length
}

/**
 * Whether a first appeal may be filed, and why not when it may not.
 *
 * s.19(1) gives an appeal to someone who "does not receive a decision within the time specified"
 * or who "is aggrieved by a decision". Those are independent: once the PIO has decided, even to
 * refuse, the appeal lies at once. Only silence has to wait out the thirty days.
 */
export function canFileFirstAppeal({
  request,
  requestId,
  today,
}: {
  request: DeadlineRequest
  requestId: string
  today: Date
}): FirstAppealEligibility {
  const settled: FirstAppealEligibility = { allowed: true, daysRemaining: null, reason: "decisionReceived", unlocksOn: null }
  const blocked = (reason: FirstAppealReason): FirstAppealEligibility => ({ allowed: false, daysRemaining: null, reason, unlocksOn: null })

  // Appeals live in the same list as requests, so the lookup will happily find one. Appealing an
  // appeal produces a "First appeal: First appeal: ..." row and no lawful filing.
  if (requestId.startsWith("RTI-A-")) return blocked("appealRow")

  if (appellateStatuses.has(request.status) || request.status === "Second Appeal") {
    return blocked("alreadyAppealed")
  }

  if (pioStatuses.has(request.status)) {
    const deadline = getRequestDeadline({ request, today })

    // An unreadable date must not trap the applicant in a gate that cannot explain itself.
    if (!deadline) return { ...settled, reason: "noClock" }

    if (deadline.hasLapsed) return { allowed: true, daysRemaining: null, reason: "lapsed", unlocksOn: null }

    // The due date is the last lawful day to reply, so the appeal opens the day after it.
    const anchor = parseRequestDate(request.submittedOn)

    return {
      allowed: false,
      daysRemaining: deadline.daysRemaining,
      reason: "waiting",
      unlocksOn: anchor ? formatRequestDate(addDays({ date: anchor, days: statutoryLimits.pioReply.days + 1 })) : null,
    }
  }

  return settled
}

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { useAuth } from "@/auth/AuthContext"
import {
  digiLockerMockProfile,
  digiLockerMockRequests,
  mockProfile,
  mockRequests,
  type ApplicantProfile,
} from "@/data/mock-profile"
import { formatRequestDate, parseRequestDate } from "@/services/statutory-deadlines"

export type RtiRequest = (typeof mockRequests)[number] & {
  applicantEmail: string
  applicantName: string
  applicantPhone: string
  /**
   * What the applicant actually asked for. Optional because the seeded history predates it, and
   * because the portal used to keep only the first 120 characters of a request - as its subject -
   * and discard the rest. Anything that displays a request should fall back to the subject.
   */
  requestText?: string
}

type CreateRequestInput = {
  applicantEmail: string
  applicantName: string
  applicantPhone: string
  authority: string
  requestText: string
  subject: string
}

type CreateFirstAppealInput = {
  originalRequest: RtiRequest
  applicantEmail: string
  applicantPhone: string
}

type RequestContextValue = {
  createFirstAppeal: (input: CreateFirstAppealInput) => RtiRequest
  createRequest: (input: CreateRequestInput) => RtiRequest
  requests: RtiRequest[]
}

/**
 * Only requests the applicant actually filed are persisted. The seeded history is rebuilt on every
 * load instead, because its newest rows are dated relative to today so the deadline tracker always
 * has a running clock, a near-expiry one and a lapsed one to show; storing them would freeze that
 * spread at whatever day the browser first opened the portal. It also retires the old habit of
 * bumping a version suffix whenever the fixtures changed.
 */
const createdRequestStorageKey = "rti-demo-created-requests-v1"
const legacyRequestStorageKey = "rti-demo-requests-v2"
const RequestContext = createContext<RequestContextValue | undefined>(undefined)

/**
 * Each seeded request is stamped with its own applicant, because useAccountRequests() below
 * filters on the signed-in email. Both demo accounts need their own history or whichever one is
 * not the owner signs in to an empty Request History.
 */
const seedFor = (requests: typeof mockRequests, profile: ApplicantProfile): RtiRequest[] =>
  requests.map((request) => ({
    ...request,
    applicantEmail: profile.email,
    applicantName: profile.fullName,
    applicantPhone: profile.mobile,
  }))

const initialRequests: RtiRequest[] = [
  ...seedFor(mockRequests, mockProfile),
  ...seedFor(digiLockerMockRequests, digiLockerMockProfile),
]

function readStored(key: string) {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return []

    const parsed = JSON.parse(stored) as RtiRequest[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Requests stored before the portal stopped formatting dates through Intl hold "03 Sept 2026",
 * which reads as a typo beside every other row's "12 Aug 2026". The tracker parses both, so this
 * is cosmetic - but it is the applicant's own request that looks wrong, so it is rewritten once on
 * the way in. Anything that will not parse is left exactly as it was found.
 */
function normaliseDates(request: RtiRequest): RtiRequest {
  const restate = (value: string) => {
    const parsed = parseRequestDate(value)

    return parsed ? formatRequestDate(parsed) : value
  }

  return { ...request, lastUpdated: restate(request.lastUpdated), submittedOn: restate(request.submittedOn) }
}

/**
 * The old store held the seeds and the applicant's own filings in one array. Anything in it that
 * is not a seed was filed by the applicant, so it is carried across rather than dropped; the
 * seeded rows in it are discarded, since those are rebuilt fresh on every load.
 */
function getStoredCreatedRequests() {
  const created = readStored(createdRequestStorageKey)

  if (created.length) return created.map(normaliseDates)

  const seededIds = new Set(initialRequests.map((request) => request.id))

  return readStored(legacyRequestStorageKey)
    .filter((request) => !seededIds.has(request.id))
    .map(normaliseDates)
}

export function RequestProvider({ children }: { children: ReactNode }) {
  const [createdRequests, setCreatedRequests] = useState<RtiRequest[]>(getStoredCreatedRequests)

  useEffect(() => {
    localStorage.setItem(createdRequestStorageKey, JSON.stringify(createdRequests))
    localStorage.removeItem(legacyRequestStorageKey)
  }, [createdRequests])

  const requests = useMemo(() => [...createdRequests, ...initialRequests], [createdRequests])

  const value = useMemo<RequestContextValue>(() => ({
    requests,
    createFirstAppeal: (input) => {
      const now = new Date()
      const appeal: RtiRequest = {
        id: `RTI-A-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`,
        subject: `First appeal: ${input.originalRequest.subject}`,
        authority: input.originalRequest.authority,
        submittedOn: formatRequestDate(now),
        lastUpdated: formatRequestDate(now),
        status: "First Appeal Filed",
        nextAction: "Awaiting review by the First Appellate Authority",
        statusClass: "border-tertiary/20 bg-tertiary-fixed text-on-tertiary-fixed-variant",
        applicantEmail: input.applicantEmail,
        applicantName: input.originalRequest.applicantName,
        applicantPhone: input.applicantPhone,
      }

      setCreatedRequests((current) => [appeal, ...current])
      return appeal
    },
    createRequest: (input) => {
      const now = new Date()
      const request: RtiRequest = {
        id: `RTI-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`,
        subject: input.subject.trim().replace(/\s+/g, " ").slice(0, 120) || "RTI information request",
        authority: input.authority || "Department of Personnel and Training",
        submittedOn: formatRequestDate(now),
        lastUpdated: formatRequestDate(now),
        status: "Pending Verification",
        nextAction: "Awaiting assignment to the concerned CPIO",
        statusClass: "border-primary/20 bg-primary-fixed text-primary",
        applicantEmail: input.applicantEmail,
        applicantName: input.applicantName,
        applicantPhone: input.applicantPhone,
        requestText: input.requestText,
      }

      setCreatedRequests((current) => [request, ...current])
      return request
    },
  }), [requests])

  return <RequestContext.Provider value={value}>{children}</RequestContext.Provider>
}

export function useRequests() {
  const context = useContext(RequestContext)

  if (!context) {
    throw new Error("useRequests must be used within RequestProvider")
  }

  return context
}

/**
 * The requests belonging to the signed-in account. Use this for account views such as RTI Request
 * History; the public lookups on View Status and the appeal pages must keep searching every request.
 */
export function useAccountRequests() {
  const { requests } = useRequests()
  const { user } = useAuth()

  return useMemo(() => {
    if (!user) return []

    const accountEmail = user.email.trim().toLowerCase()
    return requests.filter((request) => request.applicantEmail.trim().toLowerCase() === accountEmail)
  }, [requests, user])
}

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { useAuth } from "@/auth/AuthContext"
import {
  digiLockerMockProfile,
  digiLockerMockRequests,
  mockProfile,
  mockRequests,
  type ApplicantProfile,
} from "@/data/mock-profile"

export type RtiRequest = (typeof mockRequests)[number] & {
  applicantEmail: string
  applicantName: string
  applicantPhone: string
}

type CreateRequestInput = {
  applicantEmail: string
  applicantName: string
  applicantPhone: string
  authority: string
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

/** Bumped when the seed data changed - a stale store holds only the password account's history. */
const requestStorageKey = "rti-demo-requests-v2"
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

function getStoredRequests() {
  try {
    const stored = localStorage.getItem(requestStorageKey)
    if (!stored) return initialRequests

    const parsed = JSON.parse(stored) as RtiRequest[]
    return Array.isArray(parsed) ? parsed : initialRequests
  } catch {
    return initialRequests
  }
}

function formatRequestDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function RequestProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<RtiRequest[]>(getStoredRequests)

  useEffect(() => {
    localStorage.setItem(requestStorageKey, JSON.stringify(requests))
  }, [requests])

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

      setRequests((current) => [appeal, ...current])
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
      }

      setRequests((current) => [request, ...current])
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

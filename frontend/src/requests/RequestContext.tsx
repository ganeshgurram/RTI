import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { mockProfile, mockRequests } from "@/data/mock-profile"

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

const requestStorageKey = "rti-demo-requests"
const RequestContext = createContext<RequestContextValue | undefined>(undefined)

const initialRequests: RtiRequest[] = mockRequests.map((request) => ({
  ...request,
  applicantEmail: mockProfile.email,
  applicantName: mockProfile.fullName,
  applicantPhone: mockProfile.mobile,
}))

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

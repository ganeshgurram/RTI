import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { useAuth } from "@/auth/AuthContext"
import { digiLockerMockProfile, digiLockerMockRequests, mockProfile, mockRequests, type ApplicantProfile } from "@/data/mock-profile"
import { api } from "@/services/api"

export type RtiRequest = (typeof mockRequests)[number] & {
  applicantEmail: string
  applicantName: string
  applicantPhone: string
  isBplApplicant?: boolean
  supportingDocumentName?: string
  requestText?: string
}

type CreateRequestInput = {
  applicantEmail: string
  applicantName: string
  applicantPhone: string
  authority: string
  requestText: string
  subject: string
  isBplApplicant?: boolean
  supportingDocumentName?: string
}

type CreateFirstAppealInput = {
  originalRequest: RtiRequest
  applicantEmail: string
  applicantPhone: string
  appealText: string
  ground?: string
}

type RequestContextValue = {
  createFirstAppeal: (input: CreateFirstAppealInput) => Promise<RtiRequest>
  createRequest: (input: CreateRequestInput) => Promise<RtiRequest>
  requests: RtiRequest[]
  isLoading: boolean
}

const RequestContext = createContext<RequestContextValue | undefined>(undefined)

const seedFor = (records: typeof mockRequests, profile: ApplicantProfile): RtiRequest[] => records.map((request) => ({
  ...request,
  applicantEmail: profile.email,
  applicantName: profile.fullName,
  applicantPhone: profile.mobile,
}))

const publicDemoRequests = [...seedFor(mockRequests, mockProfile), ...seedFor(digiLockerMockRequests, digiLockerMockProfile)]

export function RequestProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [accountRequests, setAccountRequests] = useState<RtiRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!isAuthenticated) {
      setAccountRequests([])
      return
    }

    setIsLoading(true)
    void api.listRequests()
      .then(({ requests }) => {
        if (!cancelled) setAccountRequests(requests as RtiRequest[])
      })
      .catch(() => {
        if (!cancelled) setAccountRequests([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [isAuthenticated])

  const requests = isAuthenticated ? accountRequests : publicDemoRequests

  const value = useMemo<RequestContextValue>(() => ({
    requests,
    isLoading,
    createRequest: async (input) => {
      const { request } = await api.createRequest(input)
      const created = request as RtiRequest
      setAccountRequests((current) => [created, ...current])
      return created
    },
    createFirstAppeal: async (input) => {
      const { appeal } = await api.createAppeal(input.originalRequest.id, { appealText: input.appealText, ground: input.ground, email: input.applicantEmail, phone: input.applicantPhone })
      const created = appeal as RtiRequest
      setAccountRequests((current) => [created, ...current])
      return created
    },
  }), [isLoading, requests])

  return <RequestContext.Provider value={value}>{children}</RequestContext.Provider>
}

export function useRequests() {
  const context = useContext(RequestContext)
  if (!context) throw new Error("useRequests must be used within RequestProvider")
  return context
}

export function useAccountRequests() {
  const { requests } = useRequests()
  const { user } = useAuth()

  return useMemo(() => {
    if (!user) return []
    return requests.filter((request) => request.applicantEmail.trim().toLowerCase() === user.email.trim().toLowerCase())
  }, [requests, user])
}

import { createContext, useContext } from "react"

/**
 * The request a first appeal is being filed against, carried through to the lookup so an
 * applicant who reached it from their own request does not retype a number already on screen.
 */
export type FirstAppealPrefill = {
  email: string
  registrationNumber: string
  /**
   * Set only when the appellant is signed in and the request is their own. The lookup exists to
   * prove which request belongs to whom, and that has already happened, so the guidelines lead
   * straight to the appeal form. Left unset for a signed-out visitor, who still has to identify it.
   */
  requestId?: string
}

/** The office an applicant picked in the directory, carried through to the request form. */
export type RequestAuthority = {
  name: string
  ministryName?: string
}

type RequestGuidelinesContextValue = {
  openRequestGuidelines: (options?: { appeal?: FirstAppealPrefill; cancelTo?: number | string; authority?: RequestAuthority; journey?: "request" | "firstAppeal" }) => void
}

export const RequestGuidelinesContext = createContext<RequestGuidelinesContextValue | null>(null)

export function useRequestGuidelines() {
  const context = useContext(RequestGuidelinesContext)

  if (!context) {
    throw new Error("useRequestGuidelines must be used within RequestGuidelinesDialogProvider")
  }

  return context
}
